"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@fosscord/api");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), (req, res) => {
    // TODO:
    res.send({ fingerprint: "", assignments: [], guild_experiments: [] });
});
exports.default = router;
//# sourceMappingURL=experiments.js.map