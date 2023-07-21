"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
const http_1 = tslib_1.__importDefault(require("http"));
const Api = tslib_1.__importStar(require("@greektube/api"));
const Gateway = tslib_1.__importStar(require("@greektube/gateway"));
const cdn_1 = require("@greektube/cdn");
const express_1 = tslib_1.__importDefault(require("express"));
const picocolors_1 = require("picocolors");
const util_1 = require("@greektube/util");
const app = (0, express_1.default)();
const server = http_1.default.createServer();
const port = Number(process.env.PORT) || 3001;
const production = process.env.NODE_ENV == "development" ? false : true;
server.on("request", app);
const api = new Api.FosscordServer({ server, port, production, app });
const cdn = new cdn_1.CDNServer({ server, port, production, app });
const gateway = new Gateway.Server({ server, port, production });
process.on("SIGTERM", async () => {
    console.log("Shutting down due to SIGTERM");
    await gateway.stop();
    await cdn.stop();
    await api.stop();
    server.close();
    util_1.Sentry.close();
});
async function main() {
    await (0, util_1.initDatabase)();
    await util_1.Config.init();
    await util_1.Sentry.init(app);
    server.listen(port);
    await Promise.all([api.start(), cdn.start(), gateway.start()]);
    util_1.Sentry.errorHandler(app);
    console.log(`[Server] ${(0, picocolors_1.green)(`listening on port ${(0, picocolors_1.bold)(port)}`)}`);
}
main().catch(console.error);
//# sourceMappingURL=Server.js.map