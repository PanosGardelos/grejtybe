"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseClass = exports.PrimaryIdColumn = exports.BaseClassWithoutId = void 0;
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const Snowflake_1 = require("../util/Snowflake");
const Database_1 = require("../util/Database");
const OrmUtils_1 = require("../imports/OrmUtils");
class BaseClassWithoutId extends typeorm_1.BaseEntity {
    get construct() {
        return this.constructor;
    }
    get metadata() {
        return (0, Database_1.getDatabase)()?.getMetadata(this.construct);
    }
    assign(props) {
        OrmUtils_1.OrmUtils.mergeDeep(this, props);
        return this;
    }
    // TODO: fix eslint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toJSON() {
        return Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/no-non-null-assertion
        this.metadata.columns // @ts-ignore
            .map((x) => [x.propertyName, this[x.propertyName]])
            .concat(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.metadata.relations.map((x) => [
            x.propertyName,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this[x.propertyName],
        ])));
    }
    static increment(conditions, propertyPath, value) {
        const repository = this.getRepository();
        return repository.increment(conditions, propertyPath, value);
    }
    static decrement(conditions, propertyPath, value) {
        const repository = this.getRepository();
        return repository.decrement(conditions, propertyPath, value);
    }
}
exports.BaseClassWithoutId = BaseClassWithoutId;
exports.PrimaryIdColumn = process.env.DATABASE?.startsWith("mongodb")
    ? typeorm_1.ObjectIdColumn
    : typeorm_1.PrimaryColumn;
class BaseClass extends BaseClassWithoutId {
    id = Snowflake_1.Snowflake.generate();
    _do_validate() {
        if (!this.id)
            this.id = Snowflake_1.Snowflake.generate();
    }
}
tslib_1.__decorate([
    (0, exports.PrimaryIdColumn)(),
    tslib_1.__metadata("design:type", String)
], BaseClass.prototype, "id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.BeforeUpdate)(),
    (0, typeorm_1.BeforeInsert)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], BaseClass.prototype, "_do_validate", null);
exports.BaseClass = BaseClass;
//# sourceMappingURL=BaseClass.js.map