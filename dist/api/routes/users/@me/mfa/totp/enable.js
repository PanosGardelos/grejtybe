"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const util_1 = require("@fosscord/util");
const api_1 = require("@fosscord/api");
const bcrypt_1 = tslib_1.__importDefault(require("bcrypt"));
const lambert_server_1 = require("lambert-server");
const node_2fa_1 = require("node-2fa");
const router = (0, express_1.Router)();
router.post("/", (0, api_1.route)({ body: "TotpEnableSchema" }), async (req, res) => {
    const body = req.body;
    const user = await util_1.User.findOneOrFail({
        where: { id: req.user_id },
        select: ["data", "email"],
    });
    // TODO: Are guests allowed to enable 2fa?
    if (user.data.hash) {
        if (!(await bcrypt_1.default.compare(body.password, user.data.hash))) {
            throw new lambert_server_1.HTTPError(req.t("auth:login.INVALID_PASSWORD"));
        }
    }
    if (!body.secret)
        throw new lambert_server_1.HTTPError(req.t("auth:login.INVALID_TOTP_SECRET"), 60005);
    if (!body.code)
        throw new lambert_server_1.HTTPError(req.t("auth:login.INVALID_TOTP_CODE"), 60008);
    if ((0, node_2fa_1.verifyToken)(body.secret, body.code)?.delta != 0)
        throw new lambert_server_1.HTTPError(req.t("auth:login.INVALID_TOTP_CODE"), 60008);
    const backup_codes = (0, util_1.generateMfaBackupCodes)(req.user_id);
    await Promise.all(backup_codes.map((x) => x.save()));
    await util_1.User.update({ id: req.user_id }, { mfa_enabled: true, totp_secret: body.secret });
    res.send({
        token: await (0, util_1.generateToken)(user.id),
        backup_codes: backup_codes.map((x) => ({
            ...x,
            expired: undefined,
        })),
    });
});
exports.default = router;
//# sourceMappingURL=enable.js.map