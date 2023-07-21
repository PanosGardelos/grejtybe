"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const util_1 = require("@greektube/util");
const lambert_server_1 = require("lambert-server");
const api_1 = require("@greektube/api");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const { guild_id } = req.params;
    const [guild, member] = await Promise.all([
        util_1.Guild.findOneOrFail({ where: { id: guild_id } }),
        util_1.Member.findOne({ where: { guild_id: guild_id, id: req.user_id } }),
    ]);
    if (!member)
        throw new lambert_server_1.HTTPError("You are not a member of the guild you are trying to access", 401);
    return res.send({
        ...guild,
        joined_at: member?.joined_at,
    });
});
router.patch("/", (0, api_1.route)({ body: "GuildUpdateSchema", permission: "MANAGE_GUILD" }), async (req, res) => {
    const body = req.body;
    const { guild_id } = req.params;
    const rights = await (0, util_1.getRights)(req.user_id);
    const permission = await (0, util_1.getPermission)(req.user_id, guild_id);
    if (!rights.has("MANAGE_GUILDS") && !permission.has("MANAGE_GUILD"))
        throw util_1.DiscordApiErrors.MISSING_PERMISSIONS.withParams("MANAGE_GUILDS");
    const guild = await util_1.Guild.findOneOrFail({
        where: { id: guild_id },
        relations: ["emojis", "roles", "stickers"],
    });
    // TODO: guild update check image
    if (body.icon && body.icon != guild.icon)
        body.icon = await (0, util_1.handleFile)(`/icons/${guild_id}`, body.icon);
    if (body.banner && body.banner !== guild.banner)
        body.banner = await (0, util_1.handleFile)(`/banners/${guild_id}`, body.banner);
    if (body.splash && body.splash !== guild.splash)
        body.splash = await (0, util_1.handleFile)(`/splashes/${guild_id}`, body.splash);
    if (body.discovery_splash &&
        body.discovery_splash !== guild.discovery_splash)
        body.discovery_splash = await (0, util_1.handleFile)(`/discovery-splashes/${guild_id}`, body.discovery_splash);
    if (body.features) {
        const diff = guild.features
            .filter((x) => !body.features?.includes(x))
            .concat(body.features.filter((x) => !guild.features.includes(x)));
        // TODO move these
        const MUTABLE_FEATURES = [
            "COMMUNITY",
            "INVITES_DISABLED",
            "DISCOVERABLE",
        ];
        for (const feature of diff) {
            if (MUTABLE_FEATURES.includes(feature))
                continue;
            throw util_1.FosscordApiErrors.FEATURE_IS_IMMUTABLE.withParams(feature);
        }
        // for some reason, they don't update in the assign.
        guild.features = body.features;
    }
    // TODO: check if body ids are valid
    guild.assign(body);
    const data = guild.toJSON();
    // TODO: guild hashes
    // TODO: fix vanity_url_code, template_id
    delete data.vanity_url_code;
    delete data.template_id;
    await Promise.all([
        guild.save(),
        (0, util_1.emitEvent)({
            event: "GUILD_UPDATE",
            data,
            guild_id,
        }),
    ]);
    return res.json(data);
});
exports.default = router;
//# sourceMappingURL=index.js.map