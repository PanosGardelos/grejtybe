"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@greektube/util");
const express_1 = require("express");
const api_1 = require("@greektube/api");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const { sticker_id } = req.params;
    res.json(await util_1.Sticker.find({ where: { id: sticker_id } }));
});
exports.default = router;
//# sourceMappingURL=index.js.map