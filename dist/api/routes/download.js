"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const { platform } = req.query;
    if (!platform)
        throw (0, util_1.FieldErrors)({
            platform: {
                code: "BASE_TYPE_REQUIRED",
                message: req.t("common:field.BASE_TYPE_REQUIRED"),
            },
        });
    const release = await util_1.Release.findOneOrFail({
        where: {
            enabled: true,
            platform: platform,
        },
        order: { pub_date: "DESC" },
    });
    res.redirect(release.url);
});
exports.default = router;
//# sourceMappingURL=download.js.map