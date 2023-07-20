"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const util_1 = require("@fosscord/util");
const api_1 = require("@fosscord/api");
const bcrypt_1 = tslib_1.__importDefault(require("bcrypt"));
const lambert_server_1 = require("lambert-server");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
router.post("/", (0, api_1.route)({ body: "RegisterSchema" }), async (req, res) => {
    const body = req.body;
    const { register, security, limits } = util_1.Config.get();
    const ip = (0, api_1.getIpAdress)(req);
    // Reg tokens
    // They're a one time use token that bypasses registration limits ( rates, disabled reg, etc )
    let regTokenUsed = false;
    if (req.get("Referrer") && req.get("Referrer")?.includes("token=")) {
        // eg theyre on https://staging.fosscord.com/register?token=whatever
        const token = req.get("Referrer")?.split("token=")[1].split("&")[0];
        if (token) {
            const regToken = await util_1.ValidRegistrationToken.findOneOrFail({
                where: { token, expires_at: (0, typeorm_1.MoreThan)(new Date()) },
            });
            await regToken.remove();
            regTokenUsed = true;
            console.log(`[REGISTER] Registration token ${token} used for registration!`);
        }
        else {
            console.log(`[REGISTER] Invalid registration token ${token} used for registration by ${ip}!`);
        }
    }
    // email will be slightly modified version of the user supplied email -> e.g. protection against GMail Trick
    const email = (0, util_1.adjustEmail)(body.email);
    // check if registration is allowed
    if (!regTokenUsed && !register.allowNewRegistration) {
        throw (0, util_1.FieldErrors)({
            email: {
                code: "REGISTRATION_DISABLED",
                message: req.t("auth:register.REGISTRATION_DISABLED"),
            },
        });
    }
    // check if the user agreed to the Terms of Service
    if (!body.consent) {
        throw (0, util_1.FieldErrors)({
            consent: {
                code: "CONSENT_REQUIRED",
                message: req.t("auth:register.CONSENT_REQUIRED"),
            },
        });
    }
    if (!regTokenUsed && register.disabled) {
        throw (0, util_1.FieldErrors)({
            email: {
                code: "DISABLED",
                message: "registration is disabled on this instance",
            },
        });
    }
    if (!regTokenUsed &&
        register.requireCaptcha &&
        security.captcha.enabled) {
        const { sitekey, service } = security.captcha;
        if (!body.captcha_key) {
            return res?.status(400).json({
                captcha_key: ["captcha-required"],
                captcha_sitekey: sitekey,
                captcha_service: service,
            });
        }
        const verify = await (0, api_1.verifyCaptcha)(body.captcha_key, ip);
        if (!verify.success) {
            return res.status(400).json({
                captcha_key: verify["error-codes"],
                captcha_sitekey: sitekey,
                captcha_service: service,
            });
        }
    }
    if (!regTokenUsed && !register.allowMultipleAccounts) {
        // TODO: check if fingerprint was eligible generated
        const exists = await util_1.User.findOne({
            where: { fingerprints: body.fingerprint },
            select: ["id"],
        });
        if (exists) {
            throw (0, util_1.FieldErrors)({
                email: {
                    code: "EMAIL_ALREADY_REGISTERED",
                    message: req.t("auth:register.EMAIL_ALREADY_REGISTERED"),
                },
            });
        }
    }
    if (!regTokenUsed && register.blockProxies) {
        if ((0, api_1.isProxy)(await (0, api_1.IPAnalysis)(ip))) {
            console.log(`proxy ${ip} blocked from registration`);
            throw new lambert_server_1.HTTPError("Your IP is blocked from registration");
        }
    }
    // TODO: gift_code_sku_id?
    // TODO: check password strength
    if (email) {
        // replace all dots and chars after +, if its a gmail.com email
        if (!email) {
            throw (0, util_1.FieldErrors)({
                email: {
                    code: "INVALID_EMAIL",
                    message: req?.t("auth:register.INVALID_EMAIL"),
                },
            });
        }
        // check if there is already an account with this email
        const exists = await util_1.User.findOne({ where: { email: email } });
        if (exists) {
            throw (0, util_1.FieldErrors)({
                email: {
                    code: "EMAIL_ALREADY_REGISTERED",
                    message: req.t("auth:register.EMAIL_ALREADY_REGISTERED"),
                },
            });
        }
    }
    else if (register.email.required) {
        throw (0, util_1.FieldErrors)({
            email: {
                code: "BASE_TYPE_REQUIRED",
                message: req.t("common:field.BASE_TYPE_REQUIRED"),
            },
        });
    }
    if (register.dateOfBirth.required && !body.date_of_birth) {
        throw (0, util_1.FieldErrors)({
            date_of_birth: {
                code: "BASE_TYPE_REQUIRED",
                message: req.t("common:field.BASE_TYPE_REQUIRED"),
            },
        });
    }
    else if (register.dateOfBirth.required &&
        register.dateOfBirth.minimum) {
        const minimum = new Date();
        minimum.setFullYear(minimum.getFullYear() - register.dateOfBirth.minimum);
        body.date_of_birth = new Date(body.date_of_birth);
        // higher is younger
        if (body.date_of_birth > minimum) {
            throw (0, util_1.FieldErrors)({
                date_of_birth: {
                    code: "DATE_OF_BIRTH_UNDERAGE",
                    message: req.t("auth:register.DATE_OF_BIRTH_UNDERAGE", {
                        years: register.dateOfBirth.minimum,
                    }),
                },
            });
        }
    }
    if (body.password) {
        // the salt is saved in the password refer to bcrypt docs
        body.password = await bcrypt_1.default.hash(body.password, 12);
    }
    else if (register.password.required) {
        throw (0, util_1.FieldErrors)({
            password: {
                code: "BASE_TYPE_REQUIRED",
                message: req.t("common:field.BASE_TYPE_REQUIRED"),
            },
        });
    }
    if (!regTokenUsed &&
        !body.invite &&
        (register.requireInvite ||
            (register.guestsRequireInvite && !register.email))) {
        // require invite to register -> e.g. for organizations to send invites to their employees
        throw (0, util_1.FieldErrors)({
            email: {
                code: "INVITE_ONLY",
                message: req.t("auth:register.INVITE_ONLY"),
            },
        });
    }
    if (!regTokenUsed &&
        limits.absoluteRate.register.enabled &&
        (await util_1.User.count({
            where: {
                created_at: (0, typeorm_1.MoreThan)(new Date(Date.now() - limits.absoluteRate.register.window)),
            },
        })) >= limits.absoluteRate.register.limit) {
        console.log(`Global register ratelimit exceeded for ${(0, api_1.getIpAdress)(req)}, ${req.body.username}, ${req.body.invite || "No invite given"}`);
        throw (0, util_1.FieldErrors)({
            email: {
                code: "TOO_MANY_REGISTRATIONS",
                message: req.t("auth:register.TOO_MANY_REGISTRATIONS"),
            },
        });
    }
    const user = await util_1.User.register({ ...body, req });
    if (body.invite) {
        // await to fail if the invite doesn't exist (necessary for requireInvite to work properly) (username only signups are possible)
        await util_1.Invite.joinGuild(user.id, body.invite);
    }
    return res.json({ token: await (0, util_1.generateToken)(user.id) });
});
exports.default = router;
/**
 * POST /auth/register
 * @argument { "fingerprint":"805826570869932034.wR8vi8lGlFBJerErO9LG5NViJFw", "email":"qo8etzvaf@gmail.com", "username":"qp39gr98", "password":"wtp9gep9gw", "invite":null, "consent":true, "date_of_birth":"2000-04-04", "gift_code_sku_id":null, "captcha_key":null}
 *
 * Field Error
 * @returns { "code": 50035, "errors": { "consent": { "_errors": [{ "code": "CONSENT_REQUIRED", "message": "You must agree to Discord's Terms of Service and Privacy Policy." }]}}, "message": "Invalid Form Body"}
 *
 * Success 200:
 * @returns {token: "OMITTED"}
 */
//# sourceMappingURL=register.js.map