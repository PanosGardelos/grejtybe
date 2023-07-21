"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const node_2fa_1 = require("node-2fa");
const lambert_server_1 = require("lambert-server");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const app = await util_1.Application.findOneOrFail({
        where: { id: req.params.id },
        relations: ["owner", "bot"],
    });
    if (app.owner.id != req.user_id)
        throw util_1.DiscordApiErrors.ACTION_NOT_AUTHORIZED_ON_APPLICATION;
    return res.json(app);
});
router.patch("/", (0, api_1.route)({ body: "ApplicationModifySchema" }), async (req, res) => {
    const body = req.body;
    const app = await util_1.Application.findOneOrFail({
        where: { id: req.params.id },
        relations: ["owner", "bot"],
    });
    if (app.owner.id != req.user_id)
        throw util_1.DiscordApiErrors.ACTION_NOT_AUTHORIZED_ON_APPLICATION;
    if (app.owner.totp_secret &&
        (!req.body.code ||
            (0, node_2fa_1.verifyToken)(app.owner.totp_secret, req.body.code)))
        throw new lambert_server_1.HTTPError(req.t("auth:login.INVALID_TOTP_CODE"), 60008);
    if (app.bot) {
        app.bot.assign({ bio: body.description });
        await app.bot.save();
    }
    app.assign(body);
    await app.save();
    return res.json(app);
});
router.post("/delete", (0, api_1.route)({}), async (req, res) => {
    const app = await util_1.Application.findOneOrFail({
        where: { id: req.params.id },
        relations: ["bot", "owner"],
    });
    if (app.owner.id != req.user_id)
        throw util_1.DiscordApiErrors.ACTION_NOT_AUTHORIZED_ON_APPLICATION;
    if (app.owner.totp_secret &&
        (!req.body.code || (0, node_2fa_1.verifyToken)(app.owner.totp_secret, req.body.code)))
        throw new lambert_server_1.HTTPError(req.t("auth:login.INVALID_TOTP_CODE"), 60008);
    await util_1.Application.delete({ id: app.id });
    res.send().status(200);
});
exports.default = router;
//# sourceMappingURL=index.js.map