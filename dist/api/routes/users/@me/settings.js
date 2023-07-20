"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const util_1 = require("@fosscord/util");
const api_1 = require("@fosscord/api");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const user = await util_1.User.findOneOrFail({
        where: { id: req.user_id },
        relations: ["settings"],
    });
    return res.json(user.settings);
});
router.patch("/", (0, api_1.route)({ body: "UserSettingsSchema" }), async (req, res) => {
    const body = req.body;
    if (body.locale === "en")
        body.locale = "en-US"; // fix discord client crash on unkown locale
    const user = await util_1.User.findOneOrFail({
        where: { id: req.user_id, bot: false },
        relations: ["settings"],
    });
    user.settings.assign(body);
    await user.settings.save();
    res.json({ ...user.settings, index: undefined });
});
exports.default = router;
//# sourceMappingURL=settings.js.map