"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluralCommandInterceptor = void 0;
const util_1 = require("@fosscord/util");
class PluralCommandInterceptor {
    async execute(ctx) {
        let result = new util_1.MessageInterceptResult();
        result.cancel = false;
        result.message = ctx.message;
        if (ctx.message.content?.toLowerCase().startsWith("p;")) {
            console.log("[PluralCommandInterceptor] Plural command prefix detected, cancelling message send. Content: ", ctx.message.content);
            result.cancel = true;
        }
        if (result.cancel) {
            /*await emitEvent({
                event: "MESSAGE_DELETE",
                channel_id: ctx.message.channel_id,
                data: {
                    id: ctx.message.id,
                    channel_id: ctx.message.channel_id,
                    guild_id: ctx.message.guild_id
                },
            } as MessageDeleteEvent);*/
            //result.message.flags = String((BigInt(ctx.message.flags ?? "0")) | MessageTypes.);
            // @ts-ignore
            result.message.content += ' (ephemeral, interceptor: PluralCommandInterceptor)';
            //prevent sending via gateway and storing:
            result.message.id = "0"; // this is implied by `result.cancel = true`, we're setting it for the following emitEvent
            await (0, util_1.emitEvent)({
                event: "MESSAGE_CREATE",
                //channel_id: ctx.opts.channel_id,
                user_id: ctx.opts.author_id,
                data: result.message.toJSON(),
            });
        }
        return result;
    }
}
exports.PluralCommandInterceptor = PluralCommandInterceptor;
//# sourceMappingURL=PluralCommandInterceptor.js.map