"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const api_1 = require("@fosscord/api");
const util_1 = require("@fosscord/util");
const lambert_server_1 = require("lambert-server");
const index_1 = require("./messages/index");
const util_2 = require("@fosscord/util");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const router = (0, express_1.Router)();
//TODO: implement webhooks
router.get("/", (0, api_1.route)({}), async (req, res) => {
    res.json([]);
});
// TODO: use Image Data Type for avatar instead of String
router.post("/", (0, api_1.route)({ body: "WebhookCreateSchema", permission: "MANAGE_WEBHOOKS" }), async (req, res) => {
    const channel_id = req.params.channel_id;
    const channel = await util_1.Channel.findOneOrFail({
        where: { id: channel_id },
    });
    (0, index_1.isTextChannel)(channel.type);
    if (!channel.guild_id)
        throw new lambert_server_1.HTTPError("Not a guild channel", 400);
    const webhook_count = await util_1.Webhook.count({ where: { channel_id } });
    const { maxWebhooks } = util_1.Config.get().limits.channel;
    if (maxWebhooks && webhook_count > maxWebhooks)
        throw util_2.DiscordApiErrors.MAXIMUM_WEBHOOKS.withParams(maxWebhooks);
    let { avatar, name } = req.body;
    name = (0, util_1.trimSpecial)(name);
    // TODO: move this
    if (name === "clyde")
        throw new lambert_server_1.HTTPError("Invalid name", 400);
    if (name === "Fosscord Ghost")
        throw new lambert_server_1.HTTPError("Invalid name", 400);
    if (avatar)
        avatar = await (0, util_1.handleFile)(`/avatars/${channel_id}`, avatar);
    const hook = util_1.Webhook.create({
        type: util_1.WebhookType.Incoming,
        name,
        avatar,
        guild_id: channel.guild_id,
        channel_id: channel.id,
        user_id: req.user_id,
        token: crypto_1.default.randomBytes(24).toString("base64"),
    });
    const user = await util_1.User.getPublicUser(req.user_id);
    return res.json({
        ...hook,
        user: user,
    });
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map