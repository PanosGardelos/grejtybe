"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@greektube/util");
const express_1 = require("express");
const api_1 = require("@greektube/api");
const router = (0, express_1.Router)();
const options = {
    test: {
        response: {
            body: "GatewayBotResponse",
        },
    },
};
router.get("/", (0, api_1.route)(options), (req, res) => {
    const { endpointPublic } = util_1.Config.get().gateway;
    res.json({
        url: endpointPublic || process.env.GATEWAY || "ws://localhost:10000",
        shards: 1,
        session_start_limit: {
            total: 1000,
            remaining: 999,
            reset_after: 14400000,
            max_concurrency: 1,
        },
    });
});
exports.default = router;
//# sourceMappingURL=bot.js.map