"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.route = void 0;
const util_1 = require("@greektube/util");
function route(opts) {
    let validate;
    if (opts.body) {
        validate = util_1.ajv.getSchema(opts.body);
        if (!validate)
            throw new Error(`Body schema ${opts.body} not found`);
    }
    return async (req, res, next) => {
        if (opts.permission) {
            const required = new util_1.Permissions(opts.permission);
            req.permission = await (0, util_1.getPermission)(req.user_id, req.params.guild_id, req.params.channel_id);
            // bitfield comparison: check if user lacks certain permission
            if (!req.permission.has(required)) {
                throw util_1.DiscordApiErrors.MISSING_PERMISSIONS.withParams(opts.permission);
            }
        }
        if (opts.right) {
            const required = new util_1.Rights(opts.right);
            req.rights = await (0, util_1.getRights)(req.user_id);
            if (!req.rights || !req.rights.has(required)) {
                throw util_1.FosscordApiErrors.MISSING_RIGHTS.withParams(opts.right);
            }
        }
        if (validate) {
            const valid = validate((0, util_1.normalizeBody)(req.body));
            if (!valid) {
                const fields = {};
                validate.errors?.forEach((x) => (fields[x.instancePath.slice(1)] = {
                    code: x.keyword,
                    message: x.message || "",
                }));
                throw (0, util_1.FieldErrors)(fields);
            }
        }
        next();
    };
}
exports.route = route;
//# sourceMappingURL=route.js.map