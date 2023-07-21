"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const util_1 = require("@greektube/util");
const api_1 = require("@greektube/api");
const bcrypt_1 = tslib_1.__importDefault(require("bcrypt"));
const lambert_server_1 = require("lambert-server");
const router = (0, express_1.Router)();
router.post("/", (0, api_1.route)({}), async (req, res) => {
    const user = await util_1.User.findOneOrFail({
        where: { id: req.user_id },
        select: ["data"],
    }); //User object
    let correctpass = true;
    if (user.data.hash) {
        // guest accounts can delete accounts without password
        correctpass = await bcrypt_1.default.compare(req.body.password, user.data.hash);
        if (!correctpass) {
            throw new lambert_server_1.HTTPError(req.t("auth:login.INVALID_PASSWORD"));
        }
    }
    // TODO: decrement guild member count
    if (correctpass) {
        await Promise.all([
            util_1.User.delete({ id: req.user_id }),
            util_1.Member.delete({ id: req.user_id }),
        ]);
        res.sendStatus(204);
    }
    else {
        res.sendStatus(401);
    }
});
exports.default = router;
//# sourceMappingURL=delete.js.map