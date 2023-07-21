"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const util_1 = require("@greektube/util");
const api_1 = require("@greektube/api");
const router = (0, express_1.Router)();
router.get("/", (0, api_1.route)({ test: { response: { body: "UserRelationsResponse" } } }), async (req, res) => {
    const mutual_relations = [];
    const requested_relations = await util_1.User.findOneOrFail({
        where: { id: req.params.id },
        relations: ["relationships"],
    });
    const self_relations = await util_1.User.findOneOrFail({
        where: { id: req.user_id },
        relations: ["relationships"],
    });
    for (const rmem of requested_relations.relationships) {
        for (const smem of self_relations.relationships)
            if (rmem.to_id === smem.to_id &&
                rmem.type === 1 &&
                rmem.to_id !== req.user_id) {
                const relation_user = await util_1.User.getPublicUser(rmem.to_id);
                mutual_relations.push({
                    id: relation_user.id,
                    username: relation_user.username,
                    avatar: relation_user.avatar,
                    discriminator: relation_user.discriminator,
                    public_flags: relation_user.public_flags,
                });
            }
    }
    res.json(mutual_relations);
});
exports.default = router;
//# sourceMappingURL=relationships.js.map