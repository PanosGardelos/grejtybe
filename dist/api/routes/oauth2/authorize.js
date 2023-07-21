"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const router = (0, express_1.Router)();
// TODO: scopes, other oauth types
router.get("/", (0, api_1.route)({}), async (req, res) => {
    // const { client_id, scope, response_type, redirect_url } = req.query;
    const { client_id } = req.query;
    const app = await util_1.Application.findOne({
        where: {
            id: client_id,
        },
        relations: ["bot"],
    });
    // TODO: use DiscordApiErrors
    // findOneOrFail throws code 404
    if (!app)
        throw util_1.DiscordApiErrors.UNKNOWN_APPLICATION;
    if (!app.bot)
        throw util_1.DiscordApiErrors.OAUTH2_APPLICATION_BOT_ABSENT;
    const bot = app.bot;
    delete app.bot;
    const user = await util_1.User.findOneOrFail({
        where: {
            id: req.user_id,
            bot: false,
        },
        select: ["id", "username", "avatar", "discriminator", "public_flags"],
    });
    const guilds = await util_1.Member.find({
        where: {
            user: {
                id: req.user_id,
            },
        },
        relations: ["guild", "roles"],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        // prettier-ignore
        select: ["guild.id", "guild.name", "guild.icon", "guild.mfa_level", "guild.owner_id", "roles.id"],
    });
    const guildsWithPermissions = guilds.map((x) => {
        const perms = x.guild.owner_id === user.id
            ? new util_1.Permissions(util_1.Permissions.FLAGS.ADMINISTRATOR)
            : util_1.Permissions.finalPermission({
                user: {
                    id: user.id,
                    roles: x.roles?.map((x) => x.id) || [],
                },
                guild: {
                    roles: x?.roles || [],
                },
            });
        return {
            id: x.guild.id,
            name: x.guild.name,
            icon: x.guild.icon,
            mfa_level: x.guild.mfa_level,
            permissions: perms.bitfield.toString(),
        };
    });
    return res.json({
        guilds: guildsWithPermissions,
        user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            avatar_decoration: null,
            discriminator: user.discriminator,
            public_flags: user.public_flags,
        },
        application: {
            id: app.id,
            name: app.name,
            icon: app.icon,
            description: app.description,
            summary: app.summary,
            type: app.type,
            hook: app.hook,
            guild_id: null,
            bot_public: app.bot_public,
            bot_require_code_grant: app.bot_require_code_grant,
            verify_key: app.verify_key,
            flags: app.flags,
        },
        bot: {
            id: bot.id,
            username: bot.username,
            avatar: bot.avatar,
            avatar_decoration: null,
            discriminator: bot.discriminator,
            public_flags: bot.public_flags,
            bot: true,
            approximated_guild_count: 0, // TODO
        },
        authorized: false,
    });
});
router.post("/", (0, api_1.route)({ body: "ApplicationAuthorizeSchema" }), async (req, res) => {
    const body = req.body;
    // const { client_id, scope, response_type, redirect_url } = req.query;
    const { client_id } = req.query;
    // TODO: captcha verification
    // TODO: MFA verification
    const perms = await (0, util_1.getPermission)(req.user_id, body.guild_id, undefined, { member_relations: ["user"] });
    // getPermission cache won't exist if we're owner
    if (Object.keys(perms.cache || {}).length > 0 &&
        perms.cache.member?.user.bot)
        throw util_1.DiscordApiErrors.UNAUTHORIZED;
    perms.hasThrow("MANAGE_GUILD");
    const app = await util_1.Application.findOne({
        where: {
            id: client_id,
        },
        relations: ["bot"],
    });
    // TODO: use DiscordApiErrors
    // findOneOrFail throws code 404
    if (!app)
        throw new util_1.ApiError("Unknown Application", 10002, 404);
    if (!app.bot)
        throw new util_1.ApiError("OAuth2 application does not have a bot", 50010, 400);
    await util_1.Member.addToGuild(app.id, body.guild_id);
    return res.json({
        location: "/oauth2/authorized", // redirect URL
    });
});
exports.default = router;
//# sourceMappingURL=authorize.js.map