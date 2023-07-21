"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authentication = exports.API_PREFIX_TRAILING_SLASH = exports.API_PREFIX = exports.NO_AUTHORIZATION_ROUTES = void 0;
const tslib_1 = require("tslib");
const lambert_server_1 = require("lambert-server");
const util_1 = require("@greektube/util");
const Sentry = tslib_1.__importStar(require("@sentry/node"));
exports.NO_AUTHORIZATION_ROUTES = [
    // Authentication routes
    "/auth/login",
    "/auth/register",
    "/auth/location-metadata",
    "/auth/mfa/totp",
    "/auth/mfa/webauthn",
    // Routes with a seperate auth system
    "/webhooks/",
    // Public information endpoints
    "/ping",
    "/gateway",
    "/experiments",
    "/updates",
    "/download",
    "/scheduled-maintenances/upcoming.json",
    // Public kubernetes integration
    "/-/readyz",
    "/-/healthz",
    // Client analytics
    "/science",
    "/track",
    // Public policy pages
    "/policies/instance",
    // Oauth callback
    "/oauth2/callback",
    // Asset delivery
    /\/guilds\/\d+\/widget\.(json|png)/,
];
exports.API_PREFIX = /^\/api(\/v\d+)?/;
exports.API_PREFIX_TRAILING_SLASH = /^\/api(\/v\d+)?\//;
async function Authentication(req, res, next) {
    if (req.method === "OPTIONS")
        return res.sendStatus(204);
    const url = req.url.replace(exports.API_PREFIX, "");
    if (url.startsWith("/invites") && req.method === "GET")
        return next();
    if (exports.NO_AUTHORIZATION_ROUTES.some((x) => {
        if (typeof x === "string")
            return url.startsWith(x);
        return x.test(url);
    }))
        return next();
    if (!req.headers.authorization)
        return next(new lambert_server_1.HTTPError("Missing Authorization Header", 401));
    Sentry.setUser({ id: req.user_id });
    try {
        const { jwtSecret } = util_1.Config.get().security;
        const { decoded, user } = await (0, util_1.checkToken)(req.headers.authorization, jwtSecret);
        req.token = decoded;
        req.user_id = decoded.id;
        req.user_bot = user.bot;
        req.rights = new util_1.Rights(Number(user.rights));
        return next();
    }
    catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return next(new lambert_server_1.HTTPError(error.toString(), 400));
    }
}
exports.Authentication = Authentication;
//# sourceMappingURL=Authentication.js.map