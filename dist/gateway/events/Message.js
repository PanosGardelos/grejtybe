"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const tslib_1 = require("tslib");
const gateway_1 = require("@greektube/gateway");
const opcodes_1 = tslib_1.__importDefault(require("../opcodes"));
const instanceOf_1 = require("../opcodes/instanceOf");
const util_1 = require("@greektube/util");
const Sentry = tslib_1.__importStar(require("@sentry/node"));
const json_bigint_1 = tslib_1.__importDefault(require("json-bigint"));
const path_1 = tslib_1.__importDefault(require("path"));
const promises_1 = tslib_1.__importDefault(require("fs/promises"));
const bigIntJson = (0, json_bigint_1.default)({ storeAsString: true });
let erlpack = null;
try {
    erlpack = require("erlpack");
}
catch (e) {
    // empty
}
async function Message(buffer) {
    // TODO: compression
    let data;
    if ((buffer instanceof Buffer && buffer[0] === 123) || // ASCII 123 = `{`. Bad check for JSON
        typeof buffer === "string") {
        data = bigIntJson.parse(buffer.toString());
    }
    else if (this.encoding === "json" && buffer instanceof Buffer) {
        if (this.inflate) {
            try {
                buffer = this.inflate.process(buffer);
            }
            catch {
                buffer = buffer.toString();
            }
        }
        data = bigIntJson.parse(buffer);
    }
    else if (this.encoding === "etf" && buffer instanceof Buffer && erlpack) {
        try {
            data = erlpack.unpack(buffer);
        }
        catch {
            return this.close(gateway_1.CLOSECODES.Decode_error);
        }
    }
    else
        return this.close(gateway_1.CLOSECODES.Decode_error);
    if (process.env.WS_VERBOSE)
        console.log(`[Websocket] Incomming message: ${JSON.stringify(data)}`);
    if (process.env.WS_DUMP) {
        const id = this.session_id || "unknown";
        await promises_1.default.mkdir(path_1.default.join("dump", id), { recursive: true });
        await promises_1.default.writeFile(path_1.default.join("dump", id, `${Date.now()}.in.json`), JSON.stringify(data, null, 2));
        if (!this.session_id)
            console.log("[Gateway] Unknown session id, dumping to unknown folder");
    }
    instanceOf_1.check.call(this, util_1.PayloadSchema, data);
    const OPCodeHandler = opcodes_1.default[data.op];
    if (!OPCodeHandler) {
        console.error("[Gateway] Unkown opcode " + data.op);
        // TODO: if all opcodes are implemented comment this out:
        // this.close(CLOSECODES.Unknown_opcode);
        return;
    }
    const transaction = data.op != 1
        ? Sentry.startTransaction({
            op: gateway_1.OPCODES[data.op],
            name: `GATEWAY ${gateway_1.OPCODES[data.op]}`,
            data: {
                ...data.d,
                token: data?.d?.token ? "[Redacted]" : undefined,
            },
        })
        : undefined;
    try {
        const ret = await OPCodeHandler.call(this, data);
        Sentry.withScope((scope) => {
            scope.setSpan(transaction);
            scope.setUser({ id: this.user_id });
            transaction?.finish();
        });
        return ret;
    }
    catch (error) {
        Sentry.withScope((scope) => {
            scope.setSpan(transaction);
            if (this.user_id)
                scope.setUser({ id: this.user_id });
            Sentry.captureException(error);
        });
        transaction?.finish();
        console.error(`Error: Op ${data.op}`, error);
        // if (!this.CLOSED && this.CLOSING)
        return this.close(gateway_1.CLOSECODES.Unknown_error);
    }
}
exports.Message = Message;
//# sourceMappingURL=Message.js.map