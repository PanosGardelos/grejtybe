"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const util_1 = require("@greektube/util");
const lambert_server_1 = require("lambert-server");
const api_1 = require("@greektube/api");
const api_2 = require("@greektube/api");
const router = (0, express_1.Router)();
const TemplateGuildProjection = [
    "name",
    "description",
    "region",
    "verification_level",
    "default_message_notifications",
    "explicit_content_filter",
    "preferred_locale",
    "afk_timeout",
    "roles",
    // "channels",
    "afk_channel_id",
    "system_channel_id",
    "system_channel_flags",
    "icon",
];
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const { guild_id } = req.params;
    const templates = await util_1.Template.find({
        where: { source_guild_id: guild_id },
    });
    return res.json(templates);
});
router.post("/", (0, api_1.route)({ body: "TemplateCreateSchema", permission: "MANAGE_GUILD" }), async (req, res) => {
    const { guild_id } = req.params;
    const guild = await util_1.Guild.findOneOrFail({
        where: { id: guild_id },
        select: TemplateGuildProjection,
    });
    const exists = await util_1.Template.findOne({
        where: { id: guild_id },
    });
    if (exists)
        throw new lambert_server_1.HTTPError("Template already exists", 400);
    const template = await util_1.Template.create({
        ...req.body,
        code: (0, api_2.generateCode)(),
        creator_id: req.user_id,
        created_at: new Date(),
        updated_at: new Date(),
        source_guild_id: guild_id,
        serialized_source_guild: guild,
    }).save();
    res.json(template);
});
router.delete("/:code", (0, api_1.route)({ permission: "MANAGE_GUILD" }), async (req, res) => {
    const { code, guild_id } = req.params;
    const template = await util_1.Template.delete({
        code,
        source_guild_id: guild_id,
    });
    res.json(template);
});
router.put("/:code", (0, api_1.route)({ permission: "MANAGE_GUILD" }), async (req, res) => {
    const { code, guild_id } = req.params;
    const guild = await util_1.Guild.findOneOrFail({
        where: { id: guild_id },
        select: TemplateGuildProjection,
    });
    const template = await util_1.Template.create({
        code,
        serialized_source_guild: guild,
    }).save();
    res.json(template);
});
router.patch("/:code", (0, api_1.route)({ body: "TemplateModifySchema", permission: "MANAGE_GUILD" }), async (req, res) => {
    const { code, guild_id } = req.params;
    const { name, description } = req.body;
    const template = await util_1.Template.create({
        code,
        name: name,
        description: description,
        source_guild_id: guild_id,
    }).save();
    res.json(template);
});
exports.default = router;
//# sourceMappingURL=templates.js.map