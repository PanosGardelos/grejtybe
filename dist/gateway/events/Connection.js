"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
const gateway_1 = require("@greektube/gateway");
const Send_1 = require("../util/Send");
const Constants_1 = require("../util/Constants");
const Heartbeat_1 = require("../util/Heartbeat");
const Close_1 = require("./Close");
const Message_1 = require("./Message");
const fast_zlib_1 = require("fast-zlib");
const url_1 = require("url");
const util_1 = require("@greektube/util");
let erlpack = null;
try {
    erlpack = require("erlpack");
}
catch (e) {
    // empty
}
// TODO: check rate limit
// TODO: specify rate limit in config
// TODO: check msg max size
async function Connection(socket, request) {
    const forwardedFor = util_1.Config.get().security.forwadedFor;
    const ipAddress = forwardedFor
        ? request.headers[forwardedFor]
        : request.socket.remoteAddress;
    socket.ipAddress = ipAddress;
    //Create session ID when the connection is opened. This allows gateway dump to group the initial websocket messages with the rest of the conversation.
    const session_id = (0, gateway_1.genSessionId)();
    socket.session_id = session_id; //Set the session of the WebSocket object
    try {
        // @ts-ignore
        socket.on("close", Close_1.Close);
        // @ts-ignore
        socket.on("message", Message_1.Message);
        socket.on("error", (err) => console.error("[Gateway]", err));
        // console.log(
        // 	`[Gateway] New connection from ${socket.ipAddress}, total ${this.clients.size}`,
        // );
        if (process.env.WS_LOGEVENTS)
            [
                "close",
                "error",
                "upgrade",
                //"message",
                "open",
                "ping",
                "pong",
                "unexpected-response",
            ].forEach((x) => {
                socket.on(x, (y) => console.log(x, y));
            });
        const { searchParams } = new url_1.URL(`http://localhost${request.url}`);
        // @ts-ignore
        socket.encoding = searchParams.get("encoding") || "json";
        if (!["json", "etf"].includes(socket.encoding))
            return socket.close(Constants_1.CLOSECODES.Decode_error);
        if (socket.encoding === "etf" && !erlpack)
            throw new Error("Erlpack is not installed: 'npm i erlpack'");
        socket.version = Number(searchParams.get("version")) || 8;
        if (socket.version != 8)
            return socket.close(Constants_1.CLOSECODES.Invalid_API_version);
        // @ts-ignore
        socket.compress = searchParams.get("compress") || "";
        if (socket.compress) {
            if (socket.compress !== "zlib-stream")
                return socket.close(Constants_1.CLOSECODES.Decode_error);
            socket.deflate = new fast_zlib_1.Deflate();
            socket.inflate = new fast_zlib_1.Inflate();
        }
        socket.events = {};
        socket.member_events = {};
        socket.permissions = {};
        socket.sequence = 0;
        (0, Heartbeat_1.setHeartbeat)(socket);
        await (0, Send_1.Send)(socket, {
            op: Constants_1.OPCODES.Hello,
            d: {
                heartbeat_interval: 1000 * 30,
            },
        });
        socket.readyTimeout = setTimeout(() => {
            return socket.close(Constants_1.CLOSECODES.Session_timed_out);
        }, 1000 * 30);
    }
    catch (error) {
        console.error(error);
        return socket.close(Constants_1.CLOSECODES.Unknown_error);
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map