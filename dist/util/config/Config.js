"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValue = void 0;
const config_1 = require("../config");
class ConfigValue {
    gateway = new config_1.EndpointConfiguration();
    cdn = new config_1.CdnConfiguration();
    api = new config_1.ApiConfiguration();
    general = new config_1.GeneralConfiguration();
    limits = new config_1.LimitsConfiguration();
    security = new config_1.SecurityConfiguration();
    login = new config_1.LoginConfiguration();
    register = new config_1.RegisterConfiguration();
    regions = new config_1.RegionConfiguration();
    guild = new config_1.GuildConfiguration();
    gif = new config_1.GifConfiguration();
    rabbitmq = new config_1.RabbitMQConfiguration();
    kafka = new config_1.KafkaConfiguration();
    templates = new config_1.TemplateConfiguration();
    client = new config_1.ClientConfiguration();
    metrics = new config_1.MetricsConfiguration();
    sentry = new config_1.SentryConfiguration();
    defaults = new config_1.DefaultsConfiguration();
    external = new config_1.ExternalTokensConfiguration();
}
exports.ConfigValue = ConfigValue;
//# sourceMappingURL=Config.js.map