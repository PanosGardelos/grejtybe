"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
require("dotenv/config");
const Server_1 = require("./Server");
const server = new Server_1.CDNServer({ port: Number(process.env.PORT) || 3003 });
server
    .start()
    .then(() => {
    console.log("[Server] started on :" + server.options.port);
})
    .catch((e) => console.error("[Server] Error starting: ", e));
module.exports = server;
//# sourceMappingURL=start.js.map