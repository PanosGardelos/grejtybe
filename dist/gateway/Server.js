"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const tslib_1 = require("tslib");
require("missing-native-js-functions");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
const util_1 = require("@fosscord/util");
const ws_1 = tslib_1.__importDefault(require("ws"));
const Connection_1 = require("./events/Connection");
const http_1 = tslib_1.__importDefault(require("http"));
class Server {
    ws;
    port;
    server;
    production;
    constructor({ port, server, production, }) {
        this.port = port;
        this.production = production || false;
        if (server)
            this.server = server;
        else {
            this.server = http_1.default.createServer(function (req, res) {
                res.writeHead(200).end("Online");
            });
        }
        this.server.on("upgrade", (request, socket, head) => {
            this.ws.handleUpgrade(request, socket, head, (socket) => {
                this.ws.emit("connection", socket, request);
            });
        });
        this.ws = new ws_1.default.Server({
            maxPayload: 4096,
            noServer: true,
        });
        this.ws.on("connection", Connection_1.Connection);
        this.ws.on("error", console.error);
    }
    async start() {
        await (0, util_1.initDatabase)();
        await util_1.Config.init();
        await (0, util_1.initEvent)();
        await util_1.Sentry.init();
        if (!this.server.listening) {
            this.server.listen(this.port);
            console.log(`[Gateway] online on 0.0.0.0:${this.port}`);
        }
    }
    async stop() {
        this.ws.clients.forEach((x) => x.close());
        this.ws.close(() => {
            this.server.close(() => {
                (0, util_1.closeDatabase)();
            });
        });
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map