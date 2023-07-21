"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGifApiKey = exports.parseGifResult = void 0;
const tslib_1 = require("tslib");
const express_1 = require("express");
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const proxy_agent_1 = tslib_1.__importDefault(require("proxy-agent"));
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const lambert_server_1 = require("lambert-server");
const router = (0, express_1.Router)();
// TODO: Move somewhere else
var TENOR_GIF_TYPES;
(function (TENOR_GIF_TYPES) {
    TENOR_GIF_TYPES[TENOR_GIF_TYPES["gif"] = 0] = "gif";
    TENOR_GIF_TYPES[TENOR_GIF_TYPES["mediumgif"] = 1] = "mediumgif";
    TENOR_GIF_TYPES[TENOR_GIF_TYPES["tinygif"] = 2] = "tinygif";
    TENOR_GIF_TYPES[TENOR_GIF_TYPES["nanogif"] = 3] = "nanogif";
    TENOR_GIF_TYPES[TENOR_GIF_TYPES["mp4"] = 4] = "mp4";
    TENOR_GIF_TYPES[TENOR_GIF_TYPES["loopedmp4"] = 5] = "loopedmp4";
    TENOR_GIF_TYPES[TENOR_GIF_TYPES["tinymp4"] = 6] = "tinymp4";
    TENOR_GIF_TYPES[TENOR_GIF_TYPES["nanomp4"] = 7] = "nanomp4";
    TENOR_GIF_TYPES[TENOR_GIF_TYPES["webm"] = 8] = "webm";
    TENOR_GIF_TYPES[TENOR_GIF_TYPES["tinywebm"] = 9] = "tinywebm";
    TENOR_GIF_TYPES[TENOR_GIF_TYPES["nanowebm"] = 10] = "nanowebm";
})(TENOR_GIF_TYPES || (TENOR_GIF_TYPES = {}));
function parseGifResult(result) {
    return {
        id: result.id,
        title: result.title,
        url: result.itemurl,
        src: result.media[0].mp4.url,
        gif_src: result.media[0].gif.url,
        width: result.media[0].mp4.dims[0],
        height: result.media[0].mp4.dims[1],
        preview: result.media[0].mp4.preview,
    };
}
exports.parseGifResult = parseGifResult;
function getGifApiKey() {
    const { enabled, provider, apiKey } = util_1.Config.get().gif;
    if (!enabled)
        throw new lambert_server_1.HTTPError(`Gifs are disabled`);
    if (provider !== "tenor" || !apiKey)
        throw new lambert_server_1.HTTPError(`${provider} gif provider not supported`);
    return apiKey;
}
exports.getGifApiKey = getGifApiKey;
router.get("/", (0, api_1.route)({}), async (req, res) => {
    // TODO: Custom providers
    // TODO: return gifs as mp4
    // const { media_format, locale } = req.query;
    const { locale } = req.query;
    const apiKey = getGifApiKey();
    const agent = new proxy_agent_1.default();
    const [responseSource, trendGifSource] = await Promise.all([
        (0, node_fetch_1.default)(`https://g.tenor.com/v1/categories?locale=${locale}&key=${apiKey}`, {
            agent,
            method: "get",
            headers: { "Content-Type": "application/json" },
        }),
        (0, node_fetch_1.default)(`https://g.tenor.com/v1/trending?locale=${locale}&key=${apiKey}`, {
            agent,
            method: "get",
            headers: { "Content-Type": "application/json" },
        }),
    ]);
    const { tags } = (await responseSource.json());
    const { results } = (await trendGifSource.json());
    res.json({
        categories: tags.map((x) => ({
            name: x.searchterm,
            src: x.image,
        })),
        gifs: [parseGifResult(results[0])],
    }).status(200);
});
exports.default = router;
//# sourceMappingURL=trending.js.map