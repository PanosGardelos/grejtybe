"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = void 0;
const lambert_server_1 = require("lambert-server");
const Constants_1 = require("../util/Constants");
function check(schema, data) {
    try {
        const error = (0, lambert_server_1.instanceOf)(schema, data, { path: "body" });
        if (error !== true) {
            throw error;
        }
        return true;
    }
    catch (error) {
        console.error(error);
        // invalid payload
        this.close(Constants_1.CLOSECODES.Decode_error);
        throw error;
    }
}
exports.check = check;
//# sourceMappingURL=instanceOf.js.map