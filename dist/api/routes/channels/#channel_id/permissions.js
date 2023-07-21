"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@greektube/util");
const express_1 = require("express");
const lambert_server_1 = require("lambert-server");
const api_1 = require("@greektube/api");
const router = (0, express_1.Router)();
// TODO: Only permissions your bot has in the guild or channel can be allowed/denied (unless your bot has a MANAGE_ROLES overwrite in the channel)
router.put("/:overwrite_id", (0, api_1.route)({
    body: "ChannelPermissionOverwriteSchema",
    permission: "MANAGE_ROLES",
}), async (req, res) => {
    const { channel_id, overwrite_id } = req.params;
    const body = req.body;
    const channel = await util_1.Channel.findOneOrFail({
        where: { id: channel_id },
    });
    if (!channel.guild_id)
        throw new lambert_server_1.HTTPError("Channel not found", 404);
    if (body.type === 0) {
        if (!(await util_1.Role.count({ where: { id: overwrite_id } })))
            throw new lambert_server_1.HTTPError("role not found", 404);
    }
    else if (body.type === 1) {
        if (!(await util_1.Member.count({ where: { id: overwrite_id } })))
            throw new lambert_server_1.HTTPError("user not found", 404);
    }
    else
        throw new lambert_server_1.HTTPError("type not supported", 501);
    let overwrite = channel.permission_overwrites?.find((x) => x.id === overwrite_id);
    if (!overwrite) {
        overwrite = {
            id: overwrite_id,
            type: body.type,
            allow: "0",
            deny: "0",
        };
        channel.permission_overwrites?.push(overwrite);
    }
    overwrite.allow = String((req.permission?.bitfield || 0n) &
        (BigInt(body.allow) || BigInt("0")));
    overwrite.deny = String((req.permission?.bitfield || 0n) &
        (BigInt(body.deny) || BigInt("0")));
    await Promise.all([
        channel.save(),
        (0, util_1.emitEvent)({
            event: "CHANNEL_UPDATE",
            channel_id,
            data: channel,
        }),
    ]);
    return res.sendStatus(204);
});
// TODO: check permission hierarchy
router.delete("/:overwrite_id", (0, api_1.route)({ permission: "MANAGE_ROLES" }), async (req, res) => {
    const { channel_id, overwrite_id } = req.params;
    const channel = await util_1.Channel.findOneOrFail({
        where: { id: channel_id },
    });
    if (!channel.guild_id)
        throw new lambert_server_1.HTTPError("Channel not found", 404);
    channel.permission_overwrites = channel.permission_overwrites?.filter((x) => x.id === overwrite_id);
    await Promise.all([
        channel.save(),
        (0, util_1.emitEvent)({
            event: "CHANNEL_UPDATE",
            channel_id,
            data: channel,
        }),
    ]);
    return res.sendStatus(204);
});
exports.default = router;
//# sourceMappingURL=permissions.js.map