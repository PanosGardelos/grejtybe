import { Message, MessageOptions } from "@greektube/util";

export interface IMessageInterceptor {
    execute(ctx: MessageInterceptorContext): Promise<MessageInterceptResult>;
}

export class MessageInterceptResult {
    cancel: boolean;
    message: Message;
}

export class MessageInterceptorContext {
    message: Message;
    opts: MessageOptions;
}