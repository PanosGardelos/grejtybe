"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), (req, res) => {
    if (!(0, util_1.getDatabase)())
        return res.sendStatus(503);
    return res.sendStatus(200);
});
exports.default = router;
//# sourceMappingURL=readyz.js.map