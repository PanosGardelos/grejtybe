"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const { general } = util_1.Config.get();
    res.json(general);
});
exports.default = router;
//# sourceMappingURL=index.js.map