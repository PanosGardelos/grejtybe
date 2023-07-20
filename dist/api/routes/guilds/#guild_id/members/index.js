"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const util_1 = require("@fosscord/util");
const api_1 = require("@fosscord/api");
const typeorm_1 = require("typeorm");
const lambert_server_1 = require("lambert-server");
const router = (0, express_1.Router)();
// TODO: send over websocket
// TODO: check for GUILD_MEMBERS intent
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const { guild_id } = req.params;
    const limit = Number(req.query.limit) || 1;
    if (limit > 1000 || limit < 1)
        throw new lambert_server_1.HTTPError("Limit must be between 1 and 1000");
    const after = `${req.query.after}`;
    const query = after ? { id: (0, typeorm_1.MoreThan)(after) } : {};
    await util_1.Member.IsInGuildOrFail(req.user_id, guild_id);
    const members = await util_1.Member.find({
        where: { guild_id, ...query },
        select: util_1.PublicMemberProjection,
        take: limit,
        order: { id: "ASC" },
    });
    return res.json(members);
});
exports.default = router;
//# sourceMappingURL=index.js.map