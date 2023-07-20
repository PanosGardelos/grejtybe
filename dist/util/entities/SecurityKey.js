"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityKey = void 0;
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const BaseClass_1 = require("./BaseClass");
const User_1 = require("./User");
let SecurityKey = class SecurityKey extends BaseClass_1.BaseClass {
    user_id;
    user;
    key_id;
    public_key;
    counter;
    name;
};
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.RelationId)((key) => key.user),
    tslib_1.__metadata("design:type", String)
], SecurityKey.prototype, "user_id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    (0, typeorm_1.ManyToOne)(() => User_1.User, {
        onDelete: "CASCADE",
    }),
    tslib_1.__metadata("design:type", User_1.User)
], SecurityKey.prototype, "user", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], SecurityKey.prototype, "key_id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], SecurityKey.prototype, "public_key", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", Number)
], SecurityKey.prototype, "counter", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], SecurityKey.prototype, "name", void 0);
SecurityKey = tslib_1.__decorate([
    (0, typeorm_1.Entity)("security_keys")
], SecurityKey);
exports.SecurityKey = SecurityKey;
//# sourceMappingURL=SecurityKey.js.map