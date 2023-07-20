"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.listenEvent = exports.initEvent = exports.emitEvent = exports.events = void 0;
const tslib_1 = require("tslib");
const RabbitMQ_1 = require("./RabbitMQ");
const events_1 = tslib_1.__importDefault(require("events"));
exports.events = new events_1.default();
async function emitEvent(payload) {
    const id = (payload.channel_id ||
        payload.user_id ||
        payload.guild_id);
    if (!id)
        return console.error("event doesn't contain any id", payload);
    if (RabbitMQ_1.RabbitMQ.connection) {
        const data = typeof payload.data === "object"
            ? JSON.stringify(payload.data)
            : payload.data; // use rabbitmq for event transmission
        await RabbitMQ_1.RabbitMQ.channel?.assertExchange(id, "fanout", {
            durable: false,
        });
        // assertQueue isn't needed, because a queue will automatically created if it doesn't exist
        const successful = RabbitMQ_1.RabbitMQ.channel?.publish(id, "", Buffer.from(`${data}`), { type: payload.event });
        if (!successful)
            throw new Error("failed to send event");
    }
    else if (process.env.EVENT_TRANSMISSION === "process") {
        process.send?.({ type: "event", event: payload, id });
    }
    else {
        exports.events.emit(id, payload);
    }
}
exports.emitEvent = emitEvent;
async function initEvent() {
    await RabbitMQ_1.RabbitMQ.init(); // does nothing if rabbitmq is not setup
    if (RabbitMQ_1.RabbitMQ.connection) {
        // empty on purpose?
    }
    else {
        // use event emitter
        // use process messages
    }
}
exports.initEvent = initEvent;
async function listenEvent(event, callback, opts) {
    if (RabbitMQ_1.RabbitMQ.connection) {
        const channel = opts?.channel || RabbitMQ_1.RabbitMQ.channel;
        if (!channel)
            throw new Error("[Events] An event was sent without an associated channel");
        return await rabbitListen(channel, event, callback, {
            acknowledge: opts?.acknowledge,
        });
    }
    else if (process.env.EVENT_TRANSMISSION === "process") {
        const cancel = async () => {
            process.removeListener("message", listener);
            process.setMaxListeners(process.getMaxListeners() - 1);
        };
        const listener = (msg) => {
            msg.type === "event" &&
                msg.id === event &&
                callback({ ...msg.event, cancel });
        };
        // TODO: assert the type is correct?
        process.addListener("message", (msg) => listener(msg));
        process.setMaxListeners(process.getMaxListeners() + 1);
        return cancel;
    }
    else {
        const listener = (opts) => callback({ ...opts, cancel });
        const cancel = async () => {
            exports.events.removeListener(event, listener);
            exports.events.setMaxListeners(exports.events.getMaxListeners() - 1);
        };
        exports.events.setMaxListeners(exports.events.getMaxListeners() + 1);
        exports.events.addListener(event, listener);
        return cancel;
    }
}
exports.listenEvent = listenEvent;
async function rabbitListen(channel, id, callback, opts) {
    await channel.assertExchange(id, "fanout", { durable: false });
    const q = await channel.assertQueue("", {
        exclusive: true,
        autoDelete: true,
    });
    const cancel = async () => {
        await channel.cancel(q.queue);
        await channel.unbindQueue(q.queue, id, "");
    };
    await channel.bindQueue(q.queue, id, "");
    await channel.consume(q.queue, (opts) => {
        if (!opts)
            return;
        const data = JSON.parse(opts.content.toString());
        const event = opts.properties.type;
        callback({
            event,
            data,
            acknowledge() {
                channel.ack(opts);
            },
            channel,
            cancel,
        });
        // rabbitCh.ack(opts);
    }, {
        noAck: !opts?.acknowledge,
    });
    return cancel;
}
//# sourceMappingURL=Event.js.map