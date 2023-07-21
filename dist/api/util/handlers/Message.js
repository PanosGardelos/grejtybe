"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.postHandleMessage = exports.handleMessage = void 0;
const tslib_1 = require("tslib");
const util_1 = require("@greektube/util");
const lambert_server_1 = require("lambert-server");
const typeorm_1 = require("typeorm");
const api_1 = require("@greektube/api");
const Sentry = tslib_1.__importStar(require("@sentry/node"));
const IMessageInterceptor_1 = require("@greektube/util/message_interceptors/IMessageInterceptor");
const PluralCommandInterceptor_1 = require("../../../util/message_interceptors/plural_tooling/PluralCommandInterceptor");
const allow_empty = false;
// TODO: check webhook, application, system author, stickers
// TODO: embed gifs/videos/images
const LINK_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;
const interceptors = [new PluralCommandInterceptor_1.PluralCommandInterceptor()];
async function runMessageInterceptors(ctx) {
    const result = new IMessageInterceptor_1.MessageInterceptResult();
    result.cancel = false;
    result.message = ctx.message;
    for (const interceptorsKey in interceptors) {
        const interceptor = interceptors[interceptorsKey];
        const interceptorResult = await interceptor.execute(ctx);
        result.message = interceptorResult.message;
        if (interceptorResult.cancel) {
            result.cancel = true;
            break;
        }
    }
    return result;
}
async function handleMessage(opts) {
    const channel = await util_1.Channel.findOneOrFail({
        where: { id: opts.channel_id },
        relations: ["recipients"],
    });
    if (!channel || !opts.channel_id)
        throw new lambert_server_1.HTTPError("Channel not found", 404);
    const stickers = opts.sticker_ids
        ? await util_1.Sticker.find({ where: { id: (0, typeorm_1.In)(opts.sticker_ids) } })
        : undefined;
    const message = util_1.Message.create({
        ...opts,
        sticker_items: stickers,
        guild_id: channel.guild_id,
        channel_id: opts.channel_id,
        attachments: opts.attachments || [],
        embeds: opts.embeds || [],
        reactions: /*opts.reactions ||*/ [],
        type: opts.type ?? 0,
    });
    if (message.content &&
        message.content.length > util_1.Config.get().limits.message.maxCharacters) {
        throw new lambert_server_1.HTTPError("Content length over max character limit");
    }
    if (opts.author_id) {
        message.author = await util_1.User.getPublicUser(opts.author_id);
        const rights = await (0, util_1.getRights)(opts.author_id);
        rights.hasThrow("SEND_MESSAGES");
    }
    if (opts.application_id) {
        message.application = await util_1.Application.findOneOrFail({
            where: { id: opts.application_id },
        });
    }
    if (opts.webhook_id) {
        message.webhook = await util_1.Webhook.findOneOrFail({
            where: { id: opts.webhook_id },
        });
    }
    const permission = await (0, util_1.getPermission)(opts.author_id, channel.guild_id, opts.channel_id);
    permission.hasThrow("SEND_MESSAGES");
    if (permission.cache.member) {
        message.member = permission.cache.member;
    }
    if (opts.tts)
        permission.hasThrow("SEND_TTS_MESSAGES");
    if (opts.message_reference) {
        permission.hasThrow("READ_MESSAGE_HISTORY");
        // code below has to be redone when we add custom message routing
        if (message.guild_id !== null) {
            const guild = await util_1.Guild.findOneOrFail({
                where: { id: channel.guild_id },
            });
            if (!guild.features.includes("CROSS_CHANNEL_REPLIES")) {
                if (opts.message_reference.guild_id !== channel.guild_id)
                    throw new lambert_server_1.HTTPError("You can only reference messages from this guild");
                if (opts.message_reference.channel_id !== opts.channel_id)
                    throw new lambert_server_1.HTTPError("You can only reference messages from this channel");
            }
        }
        /** Q: should be checked if the referenced message exists? ANSWER: NO
         otherwise backfilling won't work **/
        message.type = util_1.MessageType.REPLY;
    }
    // TODO: stickers/activity
    if (!allow_empty &&
        !opts.content &&
        !opts.embeds?.length &&
        !opts.attachments?.length &&
        !opts.sticker_ids?.length) {
        throw new lambert_server_1.HTTPError("Empty messages are not allowed", 50006);
    }
    let content = opts.content;
    const mention_channel_ids = [];
    const mention_role_ids = [];
    const mention_user_ids = [];
    let mention_everyone = false;
    if (content) {
        // TODO: explicit-only mentions
        message.content = content.trim();
        content = content.replace(/ *`[^)]*` */g, ""); // remove codeblocks
        for (const [, mention] of content.matchAll(util_1.CHANNEL_MENTION)) {
            if (!mention_channel_ids.includes(mention))
                mention_channel_ids.push(mention);
        }
        for (const [, mention] of content.matchAll(util_1.USER_MENTION)) {
            if (!mention_user_ids.includes(mention))
                mention_user_ids.push(mention);
        }
        await Promise.all(Array.from(content.matchAll(util_1.ROLE_MENTION)).map(async ([, mention]) => {
            const role = await util_1.Role.findOneOrFail({
                where: { id: mention, guild_id: channel.guild_id },
            });
            if (role.mentionable || permission.has("MANAGE_ROLES")) {
                mention_role_ids.push(mention);
            }
        }));
        if (permission.has("MENTION_EVERYONE")) {
            mention_everyone =
                !!content.match(util_1.EVERYONE_MENTION) ||
                    !!content.match(util_1.HERE_MENTION);
        }
    }
    message.mention_channels = mention_channel_ids.map((x) => util_1.Channel.create({ id: x }));
    message.mention_roles = mention_role_ids.map((x) => util_1.Role.create({ id: x }));
    message.mentions = mention_user_ids.map((x) => util_1.User.create({ id: x }));
    message.mention_everyone = mention_everyone;
    // TODO: check and put it all in the body
    // root@Rory - 2023-02-18 - Add message interceptors, for use in dev/plurality, might be useful for plugins too.
    let interceptMessageResult = await runMessageInterceptors({
        opts,
        message,
    });
    if (interceptMessageResult.cancel) {
        message.id = "0"; //identify as cancelled message, as to prevent it from being distributed
        return message;
    }
    return message;
}
exports.handleMessage = handleMessage;
// TODO: cache link result in db
async function postHandleMessage(message) {
    if (message.id == "0")
        return; // don't handle cancelled messages
    const content = message.content?.replace(/ *`[^)]*` */g, ""); // remove markdown
    let links = content?.match(LINK_REGEX);
    if (!links)
        return;
    const data = { ...message };
    data.embeds = data.embeds.filter((x) => x.type !== "link");
    links = links.slice(0, 20); // embed max 20 links — TODO: make this configurable with instance policies
    const cachePromises = [];
    for (const link of links) {
        const url = new URL(link);
        const cached = await util_1.EmbedCache.findOne({ where: { url: link } });
        if (cached) {
            data.embeds.push(cached.embed);
            continue;
        }
        // bit gross, but whatever!
        const endpointPublic = util_1.Config.get().cdn.endpointPublic || "http://127.0.0.1"; // lol
        const handler = url.hostname == new URL(endpointPublic).hostname
            ? api_1.EmbedHandlers["self"]
            : api_1.EmbedHandlers[url.hostname] || api_1.EmbedHandlers["default"];
        try {
            let res = await handler(url);
            if (!res)
                continue;
            // tried to use shorthand but types didn't like me L
            if (!Array.isArray(res))
                res = [res];
            for (const embed of res) {
                const cache = util_1.EmbedCache.create({
                    url: link,
                    embed: embed,
                });
                cachePromises.push(cache.save());
                data.embeds.push(embed);
            }
        }
        catch (e) {
            console.error(`[Embeds] Error while generating embed`, e);
            Sentry.captureException(e, (scope) => {
                scope.clear();
                scope.setContext("request", { url });
                return scope;
            });
            continue;
        }
    }
    if (!data.embeds)
        return;
    await Promise.all([
        (0, util_1.emitEvent)({
            event: "MESSAGE_UPDATE",
            channel_id: message.channel_id,
            data,
        }),
        util_1.Message.update({ id: message.id, channel_id: message.channel_id }, { embeds: data.embeds }),
        ...cachePromises,
    ]);
}
exports.postHandleMessage = postHandleMessage;
async function sendMessage(opts) {
    const message = await handleMessage({ ...opts, timestamp: new Date() });
    if (message.id == "0")
        return; // don't handle cancelled messages
    await Promise.all([
        util_1.Message.insert(message),
        (0, util_1.emitEvent)({
            event: "MESSAGE_CREATE",
            channel_id: opts.channel_id,
            data: message.toJSON(),
        }),
    ]);
    // no await as it should catch error non-blockingly
    postHandleMessage(message).catch((e) => console.error("[Message] post-message handler failed", e));
    return message;
}
exports.sendMessage = sendMessage;
//# sourceMappingURL=Message.js.map