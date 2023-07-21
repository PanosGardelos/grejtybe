"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@greektube/util");
const express_1 = require("express");
const api_1 = require("@greektube/api");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const { offset, limit, categories } = req.query;
    const showAllGuilds = util_1.Config.get().guild.discovery.showAllGuilds;
    const configLimit = util_1.Config.get().guild.discovery.limit;
    let guilds;
    if (categories == undefined) {
        guilds = showAllGuilds
            ? await util_1.Guild.find({ take: Math.abs(Number(limit || configLimit)) })
            : await util_1.Guild.find({
                where: { features: (0, typeorm_1.Like)(`%DISCOVERABLE%`) },
                take: Math.abs(Number(limit || configLimit)),
            });
    }
    else {
        guilds = showAllGuilds
            ? await util_1.Guild.find({
                where: { primary_category_id: categories.toString() },
                take: Math.abs(Number(limit || configLimit)),
            })
            : await util_1.Guild.find({
                where: {
                    primary_category_id: categories.toString(),
                    features: (0, typeorm_1.Like)("%DISCOVERABLE%"),
                },
                take: Math.abs(Number(limit || configLimit)),
            });
    }
    const total = guilds ? guilds.length : undefined;
    res.send({
        total: total,
        guilds: guilds,
        offset: Number(offset || util_1.Config.get().guild.discovery.offset),
        limit: Number(limit || configLimit),
    });
});
exports.default = router;
//# sourceMappingURL=discoverable-guilds.js.map