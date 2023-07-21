"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const express_1 = require("express");
const lambert_server_1 = require("lambert-server");
const router = (0, express_1.Router)();
function toArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}
router.post("/", (0, api_1.route)({ body: "WebAuthnTotpSchema" }), async (req, res) => {
    if (!util_1.WebAuthn.fido2) {
        // TODO: I did this for typescript and I can't use !
        throw new Error("WebAuthn not enabled");
    }
    const { code, ticket } = req.body;
    const user = await util_1.User.findOneOrFail({
        where: {
            totp_last_ticket: ticket,
        },
        select: ["id", "settings"],
    });
    const ret = await (0, util_1.verifyWebAuthnToken)(ticket);
    if (!ret)
        throw new lambert_server_1.HTTPError(req.t("auth:login.INVALID_TOTP_CODE"), 60008);
    await util_1.User.update({ id: user.id }, { totp_last_ticket: "" });
    const clientAttestationResponse = JSON.parse(code);
    if (!clientAttestationResponse.rawId)
        throw new lambert_server_1.HTTPError("Missing rawId", 400);
    clientAttestationResponse.rawId = toArrayBuffer(Buffer.from(clientAttestationResponse.rawId, "base64url"));
    const securityKey = await util_1.SecurityKey.findOneOrFail({
        where: {
            key_id: Buffer.from(clientAttestationResponse.rawId, "base64url").toString("base64"),
        },
    });
    const assertionExpectations = JSON.parse(Buffer.from(clientAttestationResponse.response.clientDataJSON, "base64").toString());
    const authnResult = await util_1.WebAuthn.fido2.assertionResult(clientAttestationResponse, {
        ...assertionExpectations,
        factor: "second",
        publicKey: securityKey.public_key,
        prevCounter: securityKey.counter,
        userHandle: securityKey.key_id,
    });
    const counter = authnResult.authnrData.get("counter");
    securityKey.counter = counter;
    await securityKey.save();
    return res.json({
        token: await (0, util_1.generateToken)(user.id),
        user_settings: user.settings,
    });
});
exports.default = router;
//# sourceMappingURL=webauthn.js.map