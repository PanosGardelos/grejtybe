"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@fosscord/util");
const api_1 = require("@fosscord/api");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.patch("/", (0, api_1.route)({ body: "MemberNickChangeSchema" }), async (req, res) => {
    const { guild_id } = req.params;
    let permissionString = "MANAGE_NICKNAMES";
    const member_id = req.params.member_id === "@me"
        ? ((permissionString = "CHANGE_NICKNAME"), req.user_id)
        : req.params.member_id;
    const perms = await (0, util_1.getPermission)(req.user_id, guild_id);
    perms.hasThrow(permissionString);
    await util_1.Member.changeNickname(member_id, guild_id, req.body.nick);
    res.status(200).send();
});
exports.default = router;
//# sourceMappingURL=nick.js.map