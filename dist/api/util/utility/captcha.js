"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCaptcha = void 0;
const tslib_1 = require("tslib");
const util_1 = require("@greektube/util");
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const verifyEndpoints = {
    hcaptcha: "https://hcaptcha.com/siteverify",
    recaptcha: "https://www.google.com/recaptcha/api/siteverify",
};
async function verifyCaptcha(response, ip) {
    const { security } = util_1.Config.get();
    const { service, secret, sitekey } = security.captcha;
    if (!service || !secret || !sitekey)
        throw new Error("CAPTCHA is not configured correctly. https://docs.fosscord.com/setup/server/security/captcha/");
    const res = await (0, node_fetch_1.default)(verifyEndpoints[service], {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `response=${encodeURIComponent(response)}` +
            `&secret=${encodeURIComponent(secret)}` +
            `&sitekey=${encodeURIComponent(sitekey)}` +
            (ip ? `&remoteip=${encodeURIComponent(ip)}` : ""),
    });
    return (await res.json());
}
exports.verifyCaptcha = verifyCaptcha;
//# sourceMappingURL=captcha.js.map