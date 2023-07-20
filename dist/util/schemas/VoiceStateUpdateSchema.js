"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceStateUpdateSchema = void 0;
exports.VoiceStateUpdateSchema = {
    $guild_id: String,
    $channel_id: String,
    self_mute: Boolean,
    self_deaf: Boolean,
    $self_video: Boolean,
    $preferred_region: String,
    $request_to_speak_timestamp: Date,
    $suppress: Boolean,
};
//# sourceMappingURL=VoiceStateUpdateSchema.js.map