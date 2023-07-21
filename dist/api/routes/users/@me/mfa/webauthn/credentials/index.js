"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const bcrypt_1 = tslib_1.__importDefault(require("bcrypt"));
const express_1 = require("express");
const lambert_server_1 = require("lambert-server");
const router = (0, express_1.Router)();
const isGenerateSchema = (body) => {
    return "password" in body;
};
const isCreateSchema = (body) => {
    return "credential" in body;
};
function toArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const securityKeys = await util_1.SecurityKey.find({
        where: {
            user_id: req.user_id,
        },
    });
    return res.json(securityKeys.map((key) => ({
        id: key.id,
        name: key.name,
    })));
});
router.post("/", (0, api_1.route)({ body: "WebAuthnPostSchema" }), async (req, res) => {
    if (!util_1.WebAuthn.fido2) {
        // TODO: I did this for typescript and I can't use !
        throw new Error("WebAuthn not enabled");
    }
    const user = await util_1.User.findOneOrFail({
        where: {
            id: req.user_id,
        },
        select: [
            "data",
            "id",
            "disabled",
            "deleted",
            "settings",
            "totp_secret",
            "mfa_enabled",
            "username",
        ],
    });
    if (isGenerateSchema(req.body)) {
        const { password } = req.body;
        const same_password = await bcrypt_1.default.compare(password, user.data.hash || "");
        if (!same_password) {
            throw (0, util_1.FieldErrors)({
                password: {
                    message: req.t("auth:login.INVALID_PASSWORD"),
                    code: "INVALID_PASSWORD",
                },
            });
        }
        const registrationOptions = await util_1.WebAuthn.fido2.attestationOptions();
        const challenge = JSON.stringify({
            publicKey: {
                ...registrationOptions,
                challenge: Buffer.from(registrationOptions.challenge).toString("base64"),
                user: {
                    id: user.id,
                    name: user.username,
                    displayName: user.username,
                },
            },
        });
        const ticket = await (0, util_1.generateWebAuthnTicket)(challenge);
        return res.json({
            ticket: ticket,
            challenge,
        });
    }
    else if (isCreateSchema(req.body)) {
        const { credential, name, ticket } = req.body;
        const verified = await (0, util_1.verifyWebAuthnToken)(ticket);
        if (!verified)
            throw new lambert_server_1.HTTPError("Invalid ticket", 400);
        const clientAttestationResponse = JSON.parse(credential);
        if (!clientAttestationResponse.rawId)
            throw new lambert_server_1.HTTPError("Missing rawId", 400);
        const rawIdBuffer = Buffer.from(clientAttestationResponse.rawId, "base64");
        clientAttestationResponse.rawId = toArrayBuffer(rawIdBuffer);
        const attestationExpectations = JSON.parse(Buffer.from(clientAttestationResponse.response.clientDataJSON, "base64").toString());
        const regResult = await util_1.WebAuthn.fido2.attestationResult(clientAttestationResponse, {
            ...attestationExpectations,
            factor: "second",
        });
        const authnrData = regResult.authnrData;
        const keyId = Buffer.from(authnrData.get("credId")).toString("base64");
        const counter = authnrData.get("counter");
        const publicKey = authnrData.get("credentialPublicKeyPem");
        const securityKey = util_1.SecurityKey.create({
            name,
            counter,
            public_key: publicKey,
            user_id: req.user_id,
            key_id: keyId,
        });
        await Promise.all([
            securityKey.save(),
            util_1.User.update({ id: req.user_id }, { webauthn_enabled: true }),
        ]);
        return res.json({
            name,
            id: securityKey.id,
        });
    }
    else {
        throw util_1.DiscordApiErrors.INVALID_AUTHENTICATION_TOKEN;
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map