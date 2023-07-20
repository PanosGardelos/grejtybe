"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@fosscord/api");
const util_1 = require("@fosscord/util");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const platform = req.query.platform;
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
    res.json({
        name: release.name,
        pub_date: release.pub_date,
        url: release.url,
        notes: release.notes,
    });
});
exports.default = router;
//# sourceMappingURL=updates.js.map