"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    //TODO
    res.send([]);
});
exports.default = router;
//# sourceMappingURL=teams.js.map