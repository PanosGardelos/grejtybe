"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const router = (0, express_1.Router)();
router.post("/", (0, api_1.route)({ right: "OPERATOR" }), async (req, res) => {
    console.log(`/stop was called by ${req.user_id} at ${new Date()}`);
    res.sendStatus(200);
    process.kill(process.pid, "SIGTERM");
});
exports.default = router;
//# sourceMappingURL=stop.js.map