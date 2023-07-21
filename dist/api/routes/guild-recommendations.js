"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@greektube/util");
const express_1 = require("express");
const api_1 = require("@greektube/api");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    // const { limit, personalization_disabled } = req.query;
    const { limit } = req.query;
    const showAllGuilds = util_1.Config.get().guild.discovery.showAllGuilds;
    const genLoadId = (size) => [...Array(size)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");
    const guilds = showAllGuilds
        ? await util_1.Guild.find({ take: Math.abs(Number(limit || 24)) })
        : await util_1.Guild.find({
            where: { features: (0, typeorm_1.Like)("%DISCOVERABLE%") },
            take: Math.abs(Number(limit || 24)),
        });
    res.send({
        recommended_guilds: guilds,
        load_id: `server_recs/${genLoadId(32)}`,
    }).status(200);
});
exports.default = router;
//# sourceMappingURL=guild-recommendations.js.map