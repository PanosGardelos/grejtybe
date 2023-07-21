"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("@greektube/api");
const util_1 = require("@greektube/util");
const router = (0, express_1.Router)();
router.post("/", (0, api_1.route)({ body: "AckBulkSchema" }), async (req, res) => {
    const body = req.body;
    // TODO: what is read_state_type ?
    await Promise.all([
        // for every new state
        ...body.read_states.map(async (x) => {
            // find an existing one
            const ret = (await util_1.ReadState.findOne({
                where: {
                    user_id: req.user_id,
                    channel_id: x.channel_id,
                },
            })) ??
                // if it doesn't exist, create it (not a promise)
                util_1.ReadState.create({
                    user_id: req.user_id,
                    channel_id: x.channel_id,
                });
            ret.last_message_id = x.message_id;
            return ret.save();
        }),
    ]);
    return res.status(204);
});
exports.default = router;
//# sourceMappingURL=ack-bulk.js.map