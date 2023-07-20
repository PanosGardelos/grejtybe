"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@fosscord/api");
const util_1 = require("@fosscord/util");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.delete("/", (0, api_1.route)({}), async (req, res) => {
    const { key_id } = req.params;
    await util_1.SecurityKey.delete({
        id: key_id,
        user_id: req.user_id,
    });
    const keys = await util_1.SecurityKey.count({ where: { user_id: req.user_id } });
    // disable webauthn if there are no keys left
    if (keys === 0)
        await util_1.User.update({ id: req.user_id }, { webauthn_enabled: false });
    res.sendStatus(204);
});
exports.default = router;
//# sourceMappingURL=index.js.map