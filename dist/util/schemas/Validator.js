"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeBody = exports.validateSchema = exports.ajv = void 0;
const tslib_1 = require("tslib");
const ajv_1 = tslib_1.__importDefault(require("ajv"));
const ajv_formats_1 = tslib_1.__importDefault(require("ajv-formats"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const SchemaPath = path_1.default.join(__dirname, "..", "..", "..", "assets", "schemas.json");
const schemas = JSON.parse(fs_1.default.readFileSync(SchemaPath, { encoding: "utf8" }));
exports.ajv = new ajv_1.default({
    allErrors: true,
    parseDate: true,
    allowDate: true,
    schemas,
    coerceTypes: true,
    messages: true,
    strict: true,
    strictRequired: true,
    allowUnionTypes: true,
});
(0, ajv_formats_1.default)(exports.ajv);
function validateSchema(schema, data) {
    const valid = exports.ajv.validate(schema, (0, exports.normalizeBody)(data));
    if (!valid)
        throw exports.ajv.errors;
    return data;
}
exports.validateSchema = validateSchema;
// Normalizer is introduced to workaround https://github.com/ajv-validator/ajv/issues/1287
// this removes null values as ajv doesn't treat them as undefined
// normalizeBody allows to handle circular structures without issues
// taken from https://github.com/serverless/serverless/blob/master/lib/classes/ConfigSchemaHandler/index.js#L30 (MIT license)
const normalizeBody = (body = {}) => {
    const normalizedObjectsSet = new WeakSet();
    const normalizeObject = (object) => {
        if (normalizedObjectsSet.has(object))
            return;
        normalizedObjectsSet.add(object);
        if (Array.isArray(object)) {
            for (const [, value] of object.entries()) {
                if (typeof value === "object")
                    normalizeObject(value);
            }
        }
        else {
            for (const [key, value] of Object.entries(object)) {
                if (value == null) {
                    if (key === "icon" ||
                        key === "avatar" ||
                        key === "banner" ||
                        key === "splash" ||
                        key === "discovery_splash")
                        continue;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    delete object[key];
                }
                else if (typeof value === "object") {
                    normalizeObject(value);
                }
            }
        }
    };
    normalizeObject(body);
    return body;
};
exports.normalizeBody = normalizeBody;
//# sourceMappingURL=Validator.js.map