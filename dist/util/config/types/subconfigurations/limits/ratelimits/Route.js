"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteRateLimit = void 0;
const _1 = require(".");
class RouteRateLimit {
    guild = {
        count: 5,
        window: 5,
    };
    webhook = {
        count: 10,
        window: 5,
    };
    channel = {
        count: 10,
        window: 5,
    };
    auth = new _1.AuthRateLimit();
}
exports.RouteRateLimit = RouteRateLimit;
//# sourceMappingURL=Route.js.map