"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedCache = void 0;
const tslib_1 = require("tslib");
const BaseClass_1 = require("./BaseClass");
const typeorm_1 = require("typeorm");
let EmbedCache = class EmbedCache extends BaseClass_1.BaseClass {
    url;
    embed;
};
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], EmbedCache.prototype, "url", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    tslib_1.__metadata("design:type", Object)
], EmbedCache.prototype, "embed", void 0);
EmbedCache = tslib_1.__decorate([
    (0, typeorm_1.Entity)("embed_cache")
], EmbedCache);
exports.EmbedCache = EmbedCache;
//# sourceMappingURL=EmbedCache.js.map