"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@fosscord/api");
const util_1 = require("@fosscord/util");
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.default = router;
router.get("/", (0, api_1.route)({ right: "OPERATOR" }), async (req, res) => {
    const count = req.query.count ? parseInt(req.query.count) : 1;
    const length = req.query.length
        ? parseInt(req.query.length)
        : 255;
    const tokens = [];
    for (let i = 0; i < count; i++) {
        const token = util_1.ValidRegistrationToken.create({
            token: (0, api_1.random)(length),
            expires_at: Date.now() +
                util_1.Config.get().security.defaultRegistrationTokenExpiration,
        });
        tokens.push(token);
    }
    // Why are these options used, exactly?
    await util_1.ValidRegistrationToken.save(tokens, {
        chunk: 1000,
        reload: false,
        transaction: false,
    });
    const ret = req.query.include_url
        ? tokens.map((x) => `${util_1.Config.get().general.frontPage}/register?token=${x.token}`)
        : tokens.map((x) => x.token);
    if (req.query.plain)
        return res.send(ret.join("\n"));
    return res.json({ tokens: ret });
});
//# sourceMappingURL=generate-registration-tokens.js.map