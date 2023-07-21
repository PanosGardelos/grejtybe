"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayloadSchema = void 0;
const lambert_server_1 = require("lambert-server");
exports.PayloadSchema = {
    op: Number,
    $d: new lambert_server_1.Tuple(Object, Number),
    $s: Number,
    $t: String,
};
//# sourceMappingURL=GatewayPayloadSchema.js.map