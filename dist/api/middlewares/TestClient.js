"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const proxy_agent_1 = tslib_1.__importDefault(require("proxy-agent"));
const util_1 = require("@greektube/util");
const ASSET_FOLDER_PATH = path_1.default.join(__dirname, "..", "..", "..", "assets");
let HAS_SHOWN_CACHE_WARNING = false;
function TestClient(app) {
    app.use("/assets", express_1.default.static(path_1.default.join(ASSET_FOLDER_PATH, "public")));
    app.use("/assets", express_1.default.static(path_1.default.join(ASSET_FOLDER_PATH, "cache")));
    // Test client is disabled, so don't need to run any more. Above should probably be moved somewhere?
    if (!util_1.Config.get().client.useTestClient) {
        app.get("*", (req, res) => {
            return res.redirect("/api/ping");
        });
        return;
    }
    const agent = new proxy_agent_1.default();
    let html = fs_1.default.readFileSync(path_1.default.join(ASSET_FOLDER_PATH, "client_test", "index.html"), { encoding: "utf-8" });
    html = applyEnv(html); // update window.GLOBAL_ENV according to config
    html = applyPlugins(html); // inject our plugins
    app.use("/assets/plugins", express_1.default.static(path_1.default.join(ASSET_FOLDER_PATH, "plugins")));
    app.use("/assets/inline-plugins", express_1.default.static(path_1.default.join(ASSET_FOLDER_PATH, "inline-plugins")));
    // Asset memory cache
    const assetCache = new Map();
    // Fetches uncached ( on disk ) assets from discord.com and stores them in memory cache.
    app.get("/assets/:file", async (req, res) => {
        delete req.headers.host;
        if (req.params.file.endsWith(".map"))
            return res.status(404);
        let response;
        let buffer;
        const cache = assetCache.get(req.params.file);
        if (!cache) {
            response = await (0, node_fetch_1.default)(`https://discord.com/assets/${req.params.file}`, {
                agent,
                headers: { ...req.headers },
            });
            buffer = await response.buffer();
        }
        else {
            response = cache.response;
            buffer = cache.buffer;
        }
        [
            "content-length",
            "content-security-policy",
            "strict-transport-security",
            "set-cookie",
            "transfer-encoding",
            "expect-ct",
            "access-control-allow-origin",
            "content-encoding",
        ].forEach((headerName) => {
            response.headers.delete(headerName);
        });
        response.headers.forEach((value, name) => res.set(name, value));
        assetCache.set(req.params.file, { buffer, response });
        if (response.status == 200 && !HAS_SHOWN_CACHE_WARNING) {
            HAS_SHOWN_CACHE_WARNING = true;
            console.warn(`[TestClient] Cache miss for file ${req.params.file}! Use 'npm run generate:client' to cache and patch.`);
        }
        return res.send(buffer);
    });
    // Instead of our generated html, send developers.html for developers endpoint
    app.get("/developers*", (req, res) => {
        res.set("Cache-Control", "public, max-age=" + 60 * 60 * 24); // 24 hours
        res.set("content-type", "text/html");
        res.send(fs_1.default.readFileSync(path_1.default.join(ASSET_FOLDER_PATH, "client_test", "developers.html"), { encoding: "utf-8" }));
    });
    // Send our generated index.html for all routes.
    app.get("*", (req, res) => {
        res.set("Cache-Control", "public, max-age=" + 60 * 60 * 24); // 24 hours
        res.set("content-type", "text/html");
        if (req.url.startsWith("/api") || req.url.startsWith("/__development"))
            return;
        return res.send(html);
    });
}
exports.default = TestClient;
// Apply gateway/cdn endpoint values from config to index.html.
const applyEnv = (html) => {
    const config = util_1.Config.get();
    const cdn = (config.cdn.endpointClient ||
        config.cdn.endpointPublic ||
        process.env.CDN ||
        "").replace(/(https?)?(:\/\/?)/g, "");
    const gateway = config.gateway.endpointClient ||
        config.gateway.endpointPublic ||
        process.env.GATEWAY ||
        "";
    if (cdn)
        html = html.replace(/CDN_HOST: .+/, `CDN_HOST: \`${cdn}\`,`);
    if (gateway)
        html = html.replace(/GATEWAY_ENDPOINT: .+/, `GATEWAY_ENDPOINT: \`${gateway}\`,`);
    return html;
};
// Injects inline, preload, and standard plugins into index.html.
const applyPlugins = (html) => {
    // Inline plugins. Injected as <script src="/assets/inline-plugins/name.js"> into head.
    const inlineFiles = fs_1.default.readdirSync(path_1.default.join(ASSET_FOLDER_PATH, "inline-plugins"));
    const inline = inlineFiles
        .filter((x) => x.endsWith(".js"))
        .map((x) => `<script src="/assets/inline-plugins/${x}"></script>`)
        .join("\n");
    html = html.replace("<!-- inline plugin marker -->", inline);
    // Preload plugins. Text content of each plugin is injected into head.
    const preloadFiles = fs_1.default.readdirSync(path_1.default.join(ASSET_FOLDER_PATH, "preload-plugins"));
    const preload = preloadFiles
        .filter((x) => x.endsWith(".js"))
        .map((x) => `<script>${fs_1.default.readFileSync(path_1.default.join(ASSET_FOLDER_PATH, "preload-plugins", x))}</script>`)
        .join("\n");
    html = html.replace("<!-- preload plugin marker -->", preload);
    // Normal plugins. Injected as <script src="/assets/plugins/name.js"> into body.
    const pluginFiles = fs_1.default.readdirSync(path_1.default.join(ASSET_FOLDER_PATH, "plugins"));
    const plugins = pluginFiles
        .filter((x) => x.endsWith(".js"))
        .map((x) => `<script src="/assets/plugins/${x}"></script>`)
        .join("\n");
    html = html.replace("<!-- plugin marker -->", plugins);
    return html;
};
//# sourceMappingURL=TestClient.js.map