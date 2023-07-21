import {
    emitEvent,
    IMessageInterceptor, Message,
    MessageCreateEvent, MessageDeleteEvent, MessageFlags,
    MessageInterceptorContext,
    MessageInterceptResult, MessageTypes
} from "@greektube/util";

export class PluralCommandInterceptor implements IMessageInterceptor {
    async execute(ctx: MessageInterceptorContext): Promise<MessageInterceptResult> {
        let result = new MessageInterceptResult();
        result.cancel = false;
        result.message = ctx.message;

        if(ctx.message.content?.toLowerCase().startsWith("p;")) {
            console.log("[PluralCommandInterceptor] Plural command prefix detected, cancelling message send. Content: ", ctx.message.content)
            result.cancel = true;
        }


        if(result.cancel) {
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
            await emitEvent({
                event: "MESSAGE_CREATE",
                //channel_id: ctx.opts.channel_id,
                user_id: ctx.opts.author_id,
                data: result.message.toJSON(),
            } as MessageCreateEvent);
        }

        return result;
    }

}