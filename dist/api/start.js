"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("module-alias/register");
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
require("missing-native-js-functions");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const Server_1 = require("./Server");
const cluster_1 = tslib_1.__importDefault(require("cluster"));
const os_1 = tslib_1.__importDefault(require("os"));
let cores = 1;
try {
    cores = Number(process.env.THREADS) || os_1.default.cpus().length;
}
catch {
    console.log("[API] Failed to get thread count! Using 1...");
}
if (cluster_1.default.isPrimary && process.env.NODE_ENV == "production") {
    console.log(`Primary ${process.pid} is running`);
    // Fork workers.
    for (let i = 0; i < cores; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on("exit", (worker) => {
        console.log(`worker ${worker.process.pid} died, restart worker`);
        cluster_1.default.fork();
    });
}
else {
    const port = Number(process.env.PORT) || 3001;
    const server = new Server_1.FosscordServer({ port });
    server.start().catch(console.error);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.server = server;
}
//# sourceMappingURL=start.js.map