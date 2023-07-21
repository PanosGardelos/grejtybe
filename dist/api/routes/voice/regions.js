"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const api_2 = require("@greektube/api");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    res.json(await (0, api_2.getVoiceRegions)((0, api_1.getIpAdress)(req), true)); //vip true?
});
exports.default = router;
//# sourceMappingURL=regions.js.map