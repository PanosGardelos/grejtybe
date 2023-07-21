"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/ban-ts-comment */
const express_1 = require("express");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const lambert_server_1 = require("lambert-server");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const { channel_id, content, 
    // include_nsfw, // TODO
    offset, sort_order, 
    // sort_by, // TODO: Handle 'relevance'
    limit, author_id, } = req.query;
    const parsedLimit = Number(limit) || 50;
    if (parsedLimit < 1 || parsedLimit > 100)
        throw new lambert_server_1.HTTPError("limit must be between 1 and 100", 422);
    if (sort_order) {
        if (typeof sort_order != "string" ||
            ["desc", "asc"].indexOf(sort_order) == -1)
            throw (0, util_1.FieldErrors)({
                sort_order: {
                    message: "Value must be one of ('desc', 'asc').",
                    code: "BASE_TYPE_CHOICES",
                },
            }); // todo this is wrong
    }
    const permissions = await (0, util_1.getPermission)(req.user_id, req.params.guild_id, channel_id);
    permissions.hasThrow("VIEW_CHANNEL");
    if (!permissions.has("READ_MESSAGE_HISTORY"))
        return res.json({ messages: [], total_results: 0 });
    const query = {
        order: {
            timestamp: sort_order
                ? sort_order.toUpperCase()
                : "DESC",
        },
        take: parsedLimit || 0,
        where: {
            guild: {
                id: req.params.guild_id,
            },
        },
        relations: [
            "author",
            "webhook",
            "application",
            "mentions",
            "mention_roles",
            "mention_channels",
            "sticker_items",
            "attachments",
        ],
        skip: offset ? Number(offset) : 0,
    };
    //@ts-ignore
    if (channel_id)
        query.where.channel = { id: channel_id };
    else {
        // get all channel IDs that this user can access
        const channels = await util_1.Channel.find({
            where: { guild_id: req.params.guild_id },
            select: ["id"],
        });
        const ids = [];
        for (const channel of channels) {
            const perm = await (0, util_1.getPermission)(req.user_id, req.params.guild_id, channel.id);
            if (!perm.has("VIEW_CHANNEL") || !perm.has("READ_MESSAGE_HISTORY"))
                continue;
            ids.push(channel.id);
        }
        //@ts-ignore
        query.where.channel = { id: (0, typeorm_1.In)(ids) };
    }
    //@ts-ignore
    if (author_id)
        query.where.author = { id: author_id };
    //@ts-ignore
    if (content)
        query.where.content = (0, typeorm_1.Like)(`%${content}%`);
    const messages = await util_1.Message.find(query);
    const messagesDto = messages.map((x) => [
        {
            id: x.id,
            type: x.type,
            content: x.content,
            channel_id: x.channel_id,
            author: {
                id: x.author?.id,
                username: x.author?.username,
                avatar: x.author?.avatar,
                avatar_decoration: null,
                discriminator: x.author?.discriminator,
                public_flags: x.author?.public_flags,
            },
            attachments: x.attachments,
            embeds: x.embeds,
            mentions: x.mentions,
            mention_roles: x.mention_roles,
            pinned: x.pinned,
            mention_everyone: x.mention_everyone,
            tts: x.tts,
            timestamp: x.timestamp,
            edited_timestamp: x.edited_timestamp,
            flags: x.flags,
            components: x.components,
            hit: true,
        },
    ]);
    return res.json({
        messages: messagesDto,
        total_results: messages.length,
    });
});
exports.default = router;
//# sourceMappingURL=search.js.map