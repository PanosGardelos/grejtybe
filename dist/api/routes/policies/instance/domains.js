"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const { cdn, gateway, api } = util_1.Config.get();
    const IdentityForm = {
        cdn: cdn.endpointPublic || process.env.CDN || "http://localhost:10000",
        gateway: gateway.endpointPublic ||
            process.env.GATEWAY ||
            "ws://localhost:10000",
        defaultApiVersion: api.defaultVersion ?? 9,
        apiEndpoint: api.endpointPublic ?? "/api",
    };
    res.json(IdentityForm);
});
exports.default = router;
//# sourceMappingURL=domains.js.map