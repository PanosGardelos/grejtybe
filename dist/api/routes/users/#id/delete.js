"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post("/", (0, api_1.route)({ right: "MANAGE_USERS" }), async (req, res) => {
    await util_1.User.findOneOrFail({
        where: { id: req.params.id },
        select: [...util_1.PrivateUserProjection, "data"],
    });
    await Promise.all([
        util_1.Member.delete({ id: req.params.id }),
        util_1.User.delete({ id: req.params.id }),
    ]);
    // TODO: respect intents as USER_DELETE has potential to cause privacy issues
    await (0, util_1.emitEvent)({
        event: "USER_DELETE",
        user_id: req.user_id,
        data: { user_id: req.params.id },
    });
    res.sendStatus(204);
});
exports.default = router;
//# sourceMappingURL=delete.js.map