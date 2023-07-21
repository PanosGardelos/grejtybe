"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const bcrypt_1 = tslib_1.__importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
router.post("/", (0, api_1.route)({ body: "BackupCodesChallengeSchema" }), async (req, res) => {
    const { password } = req.body;
    const user = await util_1.User.findOneOrFail({
        where: { id: req.user_id },
        select: ["data"],
    });
    if (!(await bcrypt_1.default.compare(password, user.data.hash || ""))) {
        throw (0, util_1.FieldErrors)({
            password: {
                message: req.t("auth:login.INVALID_PASSWORD"),
                code: "INVALID_PASSWORD",
            },
        });
    }
    return res.json({
        nonce: "NoncePlaceholder",
        regenerate_nonce: "RegenNoncePlaceholder",
    });
});
exports.default = router;
//# sourceMappingURL=view-backup-codes-challenge.js.map