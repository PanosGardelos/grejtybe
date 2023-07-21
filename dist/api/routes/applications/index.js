"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({}), async (req, res) => {
    const results = await util_1.Application.find({
        where: { owner: { id: req.user_id } },
        relations: ["owner", "bot"],
    });
    res.json(results).status(200);
});
router.post("/", (0, api_1.route)({ body: "ApplicationCreateSchema" }), async (req, res) => {
    const body = req.body;
    const user = await util_1.User.findOneOrFail({ where: { id: req.user_id } });
    const app = util_1.Application.create({
        name: (0, util_1.trimSpecial)(body.name),
        description: "",
        bot_public: true,
        owner: user,
        verify_key: "IMPLEMENTME",
        flags: 0,
    });
    await app.save();
    res.json(app);
});
exports.default = router;
//# sourceMappingURL=index.js.map