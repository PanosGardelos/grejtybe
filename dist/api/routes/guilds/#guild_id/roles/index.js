"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const util_1 = require("@greektube/util");
const api_1 = require("@greektube/api");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const guild_id = req.params.guild_id;
    await util_1.Member.IsInGuildOrFail(req.user_id, guild_id);
    const roles = await util_1.Role.find({ where: { guild_id: guild_id } });
    return res.json(roles);
});
router.post("/", (0, api_1.route)({ body: "RoleModifySchema", permission: "MANAGE_ROLES" }), async (req, res) => {
    const guild_id = req.params.guild_id;
    const body = req.body;
    const role_count = await util_1.Role.count({ where: { guild_id } });
    const { maxRoles } = util_1.Config.get().limits.guild;
    if (role_count > maxRoles)
        throw util_1.DiscordApiErrors.MAXIMUM_ROLES.withParams(maxRoles);
    const role = util_1.Role.create({
        // values before ...body are default and can be overriden
        position: 1,
        hoist: false,
        color: 0,
        mentionable: false,
        ...body,
        guild_id: guild_id,
        managed: false,
        permissions: String((req.permission?.bitfield || 0n) &
            BigInt(body.permissions || "0")),
        tags: undefined,
        icon: undefined,
        unicode_emoji: undefined,
        id: util_1.Snowflake.generate(),
    });
    await Promise.all([
        role.save(),
        // Move all existing roles up one position, to accommodate the new role
        util_1.Role.createQueryBuilder("roles")
            .where({
            guild: { id: guild_id },
            name: (0, typeorm_1.Not)("@everyone"),
            id: (0, typeorm_1.Not)(role.id),
        })
            .update({ position: () => "position + 1" })
            .execute(),
        (0, util_1.emitEvent)({
            event: "GUILD_ROLE_CREATE",
            guild_id,
            data: {
                guild_id,
                role: role,
            },
        }),
    ]);
    res.json(role);
});
router.patch("/", (0, api_1.route)({ body: "RolePositionUpdateSchema" }), async (req, res) => {
    const { guild_id } = req.params;
    const body = req.body;
    const perms = await (0, util_1.getPermission)(req.user_id, guild_id);
    perms.hasThrow("MANAGE_ROLES");
    await Promise.all(body.map(async (x) => util_1.Role.update({ guild_id, id: x.id }, { position: x.position })));
    const roles = await util_1.Role.find({
        where: body.map((x) => ({ id: x.id, guild_id })),
    });
    await Promise.all(roles.map((x) => (0, util_1.emitEvent)({
        event: "GUILD_ROLE_UPDATE",
        guild_id,
        data: {
            guild_id,
            role: x,
        },
    })));
    res.json(roles);
});
exports.default = router;
//# sourceMappingURL=index.js.map