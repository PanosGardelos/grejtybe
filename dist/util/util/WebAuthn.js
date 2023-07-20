"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebAuthnToken = exports.generateWebAuthnTicket = exports.WebAuthn = void 0;
const tslib_1 = require("tslib");
const fido2_lib_1 = require("fido2-lib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const Config_1 = require("./Config");
const JWTOptions = {
    algorithm: "HS256",
    expiresIn: "5m",
};
exports.WebAuthn = {
    fido2: null,
    init: function () {
        this.fido2 = new fido2_lib_1.Fido2Lib({
            challengeSize: 128,
        });
    },
};
async function generateWebAuthnTicket(challenge) {
    return new Promise((res, rej) => {
        jsonwebtoken_1.default.sign({ challenge }, Config_1.Config.get().security.jwtSecret, JWTOptions, (err, token) => {
            if (err || !token)
                return rej(err || "no token");
            return res(token);
        });
    });
}
exports.generateWebAuthnTicket = generateWebAuthnTicket;
async function verifyWebAuthnToken(token) {
    return new Promise((res, rej) => {
        jsonwebtoken_1.default.verify(token, Config_1.Config.get().security.jwtSecret, JWTOptions, async (err, decoded) => {
            if (err)
                return rej(err);
            return res(decoded);
        });
    });
}
exports.verifyWebAuthnToken = verifyWebAuthnToken;
//# sourceMappingURL=WebAuthn.js.map