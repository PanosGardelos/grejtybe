"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const util_1 = require("@greektube/util");
const api_1 = require("@greektube/api");
const router = (0, express_1.Router)();
// GET doesn't exist on discord.com
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const user = await util_1.Member.findOneOrFail({
        where: { id: req.user_id, guild_id: req.params.guild_id },
        select: ["settings"],
    });
    return res.json(user.settings);
});
router.patch("/", (0, api_1.route)({ body: "UserGuildSettingsSchema" }), async (req, res) => {
    const body = req.body;
    if (body.channel_overrides) {
        for (const channel in body.channel_overrides) {
            util_1.Channel.findOneOrFail({ where: { id: channel } });
        }
    }
    const user = await util_1.Member.findOneOrFail({
        where: { id: req.user_id, guild_id: req.params.guild_id },
        select: ["settings"],
    });
    util_1.OrmUtils.mergeDeep(user.settings || {}, body);
    util_1.Member.update({ id: req.user_id, guild_id: req.params.guild_id }, user);
    res.json(user.settings);
});
exports.default = router;
//# sourceMappingURL=settings.js.map