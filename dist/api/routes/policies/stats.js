"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    if (!util_1.Config.get().security.statsWorldReadable) {
        const rights = await (0, util_1.getRights)(req.user_id);
        rights.hasThrow("VIEW_SERVER_STATS");
    }
    res.json({
        counts: {
            user: await util_1.User.count(),
            guild: await util_1.Guild.count(),
            message: await util_1.Message.count(),
            members: await util_1.Member.count(),
        },
    });
});
exports.default = router;
//# sourceMappingURL=stats.js.map