"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const lambert_server_1 = require("lambert-server");
const node_2fa_1 = require("node-2fa");
const router = (0, express_1.Router)();
router.post("/", (0, api_1.route)({}), async (req, res) => {
    const app = await util_1.Application.findOneOrFail({
        where: { id: req.params.id },
        relations: ["owner"],
    });
    if (app.owner.id != req.user_id)
        throw util_1.DiscordApiErrors.ACTION_NOT_AUTHORIZED_ON_APPLICATION;
    const user = await util_1.User.register({
        username: app.name,
        password: undefined,
        id: app.id,
        req,
    });
    user.id = app.id;
    user.premium_since = new Date();
    user.bot = true;
    await user.save();
    // flags is NaN here?
    app.assign({ bot: user, flags: app.flags || 0 });
    await app.save();
    res.send({
        token: await (0, util_1.generateToken)(user.id),
    }).status(204);
});
router.post("/reset", (0, api_1.route)({}), async (req, res) => {
    const bot = await util_1.User.findOneOrFail({ where: { id: req.params.id } });
    const owner = await util_1.User.findOneOrFail({ where: { id: req.user_id } });
    if (owner.id != req.user_id)
        throw util_1.DiscordApiErrors.ACTION_NOT_AUTHORIZED_ON_APPLICATION;
    if (owner.totp_secret &&
        (!req.body.code || (0, node_2fa_1.verifyToken)(owner.totp_secret, req.body.code)))
        throw new lambert_server_1.HTTPError(req.t("auth:login.INVALID_TOTP_CODE"), 60008);
    bot.data = { hash: undefined, valid_tokens_since: new Date() };
    await bot.save();
    const token = await (0, util_1.generateToken)(bot.id);
    res.json({ token }).status(200);
});
router.patch("/", (0, api_1.route)({ body: "BotModifySchema" }), async (req, res) => {
    const body = req.body;
    if (!body.avatar?.trim())
        delete body.avatar;
    const app = await util_1.Application.findOneOrFail({
        where: { id: req.params.id },
        relations: ["bot", "owner"],
    });
    if (!app.bot)
        throw util_1.DiscordApiErrors.BOT_ONLY_ENDPOINT;
    if (app.owner.id != req.user_id)
        throw util_1.DiscordApiErrors.ACTION_NOT_AUTHORIZED_ON_APPLICATION;
    if (body.avatar)
        body.avatar = await (0, util_1.handleFile)(`/avatars/${app.id}`, body.avatar);
    app.bot.assign(body);
    app.bot.save();
    await app.save();
    res.json(app).status(200);
});
exports.default = router;
//# sourceMappingURL=index.js.map