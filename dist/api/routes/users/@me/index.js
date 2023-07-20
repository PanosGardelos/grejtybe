"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const util_1 = require("@fosscord/util");
const api_1 = require("@fosscord/api");
const bcrypt_1 = tslib_1.__importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    res.json(await util_1.User.findOne({
        select: util_1.PrivateUserProjection,
        where: { id: req.user_id },
    }));
});
router.patch("/", (0, api_1.route)({ body: "UserModifySchema" }), async (req, res) => {
    const body = req.body;
    const user = await util_1.User.findOneOrFail({
        where: { id: req.user_id },
        select: [...util_1.PrivateUserProjection, "data"],
    });
    // Populated on password change
    let newToken;
    if (body.avatar)
        body.avatar = await (0, util_1.handleFile)(`/avatars/${req.user_id}`, body.avatar);
    if (body.banner)
        body.banner = await (0, util_1.handleFile)(`/banners/${req.user_id}`, body.banner);
    if (body.password) {
        if (user.data?.hash) {
            const same_password = await bcrypt_1.default.compare(body.password, user.data.hash || "");
            if (!same_password) {
                throw (0, util_1.FieldErrors)({
                    password: {
                        message: req.t("auth:login.INVALID_PASSWORD"),
                        code: "INVALID_PASSWORD",
                    },
                });
            }
        }
        else {
            user.data.hash = await bcrypt_1.default.hash(body.password, 12);
        }
    }
    if (body.email) {
        body.email = (0, util_1.adjustEmail)(body.email);
        if (!body.email && util_1.Config.get().register.email.required)
            throw (0, util_1.FieldErrors)({
                email: {
                    message: req.t("auth:register.EMAIL_INVALID"),
                    code: "EMAIL_INVALID",
                },
            });
        if (!body.password)
            throw (0, util_1.FieldErrors)({
                password: {
                    message: req.t("auth:register.INVALID_PASSWORD"),
                    code: "INVALID_PASSWORD",
                },
            });
    }
    if (body.new_password) {
        if (!body.password && !user.email) {
            throw (0, util_1.FieldErrors)({
                password: {
                    code: "BASE_TYPE_REQUIRED",
                    message: req.t("common:field.BASE_TYPE_REQUIRED"),
                },
            });
        }
        user.data.hash = await bcrypt_1.default.hash(body.new_password, 12);
        user.data.valid_tokens_since = new Date();
        newToken = (await (0, util_1.generateToken)(user.id));
    }
    if (body.username) {
        const check_username = body?.username?.replace(/\s/g, "");
        if (!check_username) {
            throw (0, util_1.FieldErrors)({
                username: {
                    code: "BASE_TYPE_REQUIRED",
                    message: req.t("common:field.BASE_TYPE_REQUIRED"),
                },
            });
        }
        const { maxUsername } = util_1.Config.get().limits.user;
        if (check_username.length > maxUsername) {
            throw (0, util_1.FieldErrors)({
                username: {
                    code: "USERNAME_INVALID",
                    message: `Username must be less than ${maxUsername} in length`,
                },
            });
        }
    }
    if (body.discriminator) {
        if (await util_1.User.findOne({
            where: {
                discriminator: body.discriminator,
                username: body.username || user.username,
            },
        })) {
            throw (0, util_1.FieldErrors)({
                discriminator: {
                    code: "INVALID_DISCRIMINATOR",
                    message: "This discriminator is already in use.",
                },
            });
        }
    }
    user.assign(body);
    user.validate();
    await user.save();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    delete user.data;
    // TODO: send update member list event in gateway
    await (0, util_1.emitEvent)({
        event: "USER_UPDATE",
        user_id: req.user_id,
        data: user,
    });
    res.json({
        ...user,
        newToken,
    });
});
exports.default = router;
// {"message": "Invalid two-factor code", "code": 60008}
//# sourceMappingURL=index.js.map