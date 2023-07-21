"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@greektube/util");
const express_1 = require("express");
const api_1 = require("@greektube/api");
const router = (0, express_1.Router)();
// TODO: public read receipts & privacy scoping
// TODO: send read state event to all channel members
// TODO: advance-only notification cursor
router.post("/", (0, api_1.route)({ body: "MessageAcknowledgeSchema" }), async (req, res) => {
    const { channel_id, message_id } = req.params;
    const permission = await (0, util_1.getPermission)(req.user_id, undefined, channel_id);
    permission.hasThrow("VIEW_CHANNEL");
    let read_state = await util_1.ReadState.findOne({
        where: { user_id: req.user_id, channel_id },
    });
    if (!read_state)
        read_state = util_1.ReadState.create({ user_id: req.user_id, channel_id });
    read_state.last_message_id = message_id;
    await read_state.save();
    await (0, util_1.emitEvent)({
        event: "MESSAGE_ACK",
        user_id: req.user_id,
        data: {
            channel_id,
            message_id,
            version: 3763,
        },
    });
    res.json({ token: null });
});
exports.default = router;
//# sourceMappingURL=ack.js.map