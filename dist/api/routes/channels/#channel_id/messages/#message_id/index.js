"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const util_1 = require("@fosscord/util");
const express_1 = require("express");
const multer_1 = tslib_1.__importDefault(require("multer"));
const api_1 = require("@fosscord/api");
const api_2 = require("@fosscord/api");
const lambert_server_1 = require("lambert-server");
const router = (0, express_1.Router)();
// TODO: message content/embed string length limit
const messageUpload = (0, multer_1.default)({
    limits: {
        fileSize: 1024 * 1024 * 100,
        fields: 10,
        files: 1,
    },
    storage: multer_1.default.memoryStorage(),
}); // max upload 50 mb
router.patch("/", (0, api_1.route)({
    body: "MessageEditSchema",
    permission: "SEND_MESSAGES",
    right: "SEND_MESSAGES",
}), async (req, res) => {
    const { message_id, channel_id } = req.params;
    let body = req.body;
    const message = await util_1.Message.findOneOrFail({
        where: { id: message_id, channel_id },
        relations: ["attachments"],
    });
    const permissions = await (0, util_1.getPermission)(req.user_id, undefined, channel_id);
    const rights = await (0, util_1.getRights)(req.user_id);
    if (req.user_id !== message.author_id) {
        if (!rights.has("MANAGE_MESSAGES")) {
            permissions.hasThrow("MANAGE_MESSAGES");
            body = { flags: body.flags };
            // guild admins can only suppress embeds of other messages, no such restriction imposed to instance-wide admins
        }
    }
    else
        rights.hasThrow("SELF_EDIT_MESSAGES");
    const new_message = await (0, api_2.handleMessage)({
        ...message,
        // TODO: should message_reference be overridable?
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        message_reference: message.message_reference,
        ...body,
        author_id: message.author_id,
        channel_id,
        id: message_id,
        edited_timestamp: new Date(),
    });
    await Promise.all([
        new_message.save(),
        await (0, util_1.emitEvent)({
            event: "MESSAGE_UPDATE",
            channel_id,
            data: { ...new_message, nonce: undefined },
        }),
    ]);
    (0, api_2.postHandleMessage)(new_message);
    // TODO: a DTO?
    return res.json({
        id: new_message.id,
        type: new_message.type,
        content: new_message.content,
        channel_id: new_message.channel_id,
        author: new_message.author?.toPublicUser(),
        attachments: new_message.attachments,
        embeds: new_message.embeds,
        mentions: new_message.embeds,
        mention_roles: new_message.mention_roles,
        mention_everyone: new_message.mention_everyone,
        pinned: new_message.pinned,
        tts: new_message.tts,
        timestamp: new_message.timestamp,
        edited_timestamp: new_message.edited_timestamp,
        flags: new_message.flags,
        components: new_message.components,
        // these are not in the Discord.com response
        mention_channels: new_message.mention_channels,
    });
});
// Backfill message with specific timestamp
router.put("/", messageUpload.single("file"), async (req, res, next) => {
    if (req.body.payload_json) {
        req.body = JSON.parse(req.body.payload_json);
    }
    next();
}, (0, api_1.route)({
    body: "MessageCreateSchema",
    permission: "SEND_MESSAGES",
    right: "SEND_BACKDATED_EVENTS",
}), async (req, res) => {
    const { channel_id, message_id } = req.params;
    const body = req.body;
    const attachments = [];
    const rights = await (0, util_1.getRights)(req.user_id);
    rights.hasThrow("SEND_MESSAGES");
    // regex to check if message contains anything other than numerals ( also no decimals )
    if (!message_id.match(/^\+?\d+$/)) {
        throw new lambert_server_1.HTTPError("Message IDs must be positive integers", 400);
    }
    const snowflake = util_1.Snowflake.deconstruct(message_id);
    if (Date.now() < snowflake.timestamp) {
        // message is in the future
        throw util_1.FosscordApiErrors.CANNOT_BACKFILL_TO_THE_FUTURE;
    }
    const exists = await util_1.Message.findOne({
        where: { id: message_id, channel_id: channel_id },
    });
    if (exists) {
        throw util_1.FosscordApiErrors.CANNOT_REPLACE_BY_BACKFILL;
    }
    if (req.file) {
        try {
            const file = await (0, util_1.uploadFile)(`/attachments/${req.params.channel_id}`, req.file);
            attachments.push(util_1.Attachment.create({ ...file, proxy_url: file.url }));
        }
        catch (error) {
            return res.status(400).json(error);
        }
    }
    const channel = await util_1.Channel.findOneOrFail({
        where: { id: channel_id },
        relations: ["recipients", "recipients.user"],
    });
    const embeds = body.embeds || [];
    if (body.embed)
        embeds.push(body.embed);
    const message = await (0, api_2.handleMessage)({
        ...body,
        type: 0,
        pinned: false,
        author_id: req.user_id,
        id: message_id,
        embeds,
        channel_id,
        attachments,
        edited_timestamp: undefined,
        timestamp: new Date(snowflake.timestamp),
    });
    //Fix for the client bug
    delete message.member;
    await Promise.all([
        message.save(),
        (0, util_1.emitEvent)({
            event: "MESSAGE_CREATE",
            channel_id: channel_id,
            data: message,
        }),
        channel.save(),
    ]);
    // no await as it shouldnt block the message send function and silently catch error
    (0, api_2.postHandleMessage)(message).catch((e) => console.error("[Message] post-message handler failed", e));
    return res.json(message);
});
router.get("/", (0, api_1.route)({ permission: "VIEW_CHANNEL" }), async (req, res) => {
    const { message_id, channel_id } = req.params;
    const message = await util_1.Message.findOneOrFail({
        where: { id: message_id, channel_id },
        relations: ["attachments"],
    });
    const permissions = await (0, util_1.getPermission)(req.user_id, undefined, channel_id);
    if (message.author_id !== req.user_id)
        permissions.hasThrow("READ_MESSAGE_HISTORY");
    return res.json(message);
});
router.delete("/", (0, api_1.route)({}), async (req, res) => {
    const { message_id, channel_id } = req.params;
    const channel = await util_1.Channel.findOneOrFail({ where: { id: channel_id } });
    const message = await util_1.Message.findOneOrFail({ where: { id: message_id } });
    const rights = await (0, util_1.getRights)(req.user_id);
    if (message.author_id !== req.user_id) {
        if (!rights.has("MANAGE_MESSAGES")) {
            const permission = await (0, util_1.getPermission)(req.user_id, channel.guild_id, channel_id);
            permission.hasThrow("MANAGE_MESSAGES");
        }
    }
    else
        rights.hasThrow("SELF_DELETE_MESSAGES");
    await util_1.Message.delete({ id: message_id });
    await (0, util_1.emitEvent)({
        event: "MESSAGE_DELETE",
        channel_id,
        data: {
            id: message_id,
            channel_id,
            guild_id: channel.guild_id,
        },
    });
    res.sendStatus(204);
});
exports.default = router;
//# sourceMappingURL=index.js.map