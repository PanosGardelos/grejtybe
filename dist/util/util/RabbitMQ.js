"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQ = void 0;
const tslib_1 = require("tslib");
const amqplib_1 = tslib_1.__importDefault(require("amqplib"));
const Config_1 = require("./Config");
exports.RabbitMQ = {
    connection: null,
    channel: null,
    init: async function () {
        const host = Config_1.Config.get().rabbitmq.host;
        if (!host)
            return;
        console.log(`[RabbitMQ] connect: ${host}`);
        this.connection = await amqplib_1.default.connect(host, {
            timeout: 1000 * 60,
        });
        console.log(`[RabbitMQ] connected`);
        this.channel = await this.connection.createChannel();
        console.log(`[RabbitMQ] channel created`);
    },
};
//# sourceMappingURL=RabbitMQ.js.map