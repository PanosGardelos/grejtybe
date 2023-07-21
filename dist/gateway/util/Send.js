"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Send = void 0;
const tslib_1 = require("tslib");
const promises_1 = tslib_1.__importDefault(require("fs/promises"));
const path_1 = tslib_1.__importDefault(require("path"));
let erlpack = null;
try {
    erlpack = require("erlpack");
}
catch (e) {
    // empty
}
function Send(socket, data) {
    if (process.env.WS_VERBOSE)
        console.log(`[Websocket] Outgoing message: ${JSON.stringify(data)}`);
    if (process.env.WS_DUMP) {
        const id = socket.session_id || "unknown";
        (async () => {
            await promises_1.default.mkdir(path_1.default.join("dump", id), {
                recursive: true,
            });
            await promises_1.default.writeFile(path_1.default.join("dump", id, `${Date.now()}.out.json`), JSON.stringify(data, null, 2));
        })();
    }
    let buffer;
    if (socket.encoding === "etf" && erlpack)
        buffer = erlpack.pack(data);
    // TODO: encode circular object
    else if (socket.encoding === "json")
        buffer = JSON.stringify(data);
    else
        return;
    // TODO: compression
    if (socket.deflate) {
        buffer = socket.deflate.process(buffer);
    }
    return new Promise((res, rej) => {
        if (socket.readyState !== 1) {
            // return rej("socket not open");
            socket.close();
            return;
        }
        socket.send(buffer, (err) => {
            if (err)
                return rej(err);
            return res(null);
        });
    });
}
exports.Send = Send;
//# sourceMappingURL=Send.js.map