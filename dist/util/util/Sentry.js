"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Sentry = void 0;
const tslib_1 = require("tslib");
const Config_1 = require("./Config");
const picocolors_1 = require("picocolors");
const SentryNode = tslib_1.__importStar(require("@sentry/node"));
const Tracing = tslib_1.__importStar(require("@sentry/tracing"));
const Integrations = tslib_1.__importStar(require("@sentry/integrations"));
// Work around for when bundle calls api/etc
let errorHandlersUsed = false;
exports.Sentry = {
    /** Call BEFORE registering your routes */
    init: async (app) => {
        const { enabled, endpoint, traceSampleRate, environment } = Config_1.Config.get().sentry;
        if (!enabled)
            return;
        if (SentryNode.getCurrentHub().getClient())
            return; // we've already initialised sentry
        console.log("[Sentry] Enabling sentry...");
        if (traceSampleRate >= 0.8) {
            console.log(`[Sentry] ${(0, picocolors_1.yellow)("Your sentry trace sampling rate is >= 80%. For large loads, this may degrade performance.")}`);
        }
        SentryNode.init({
            dsn: endpoint,
            integrations: [
                new SentryNode.Integrations.Http({ tracing: true }),
                new Tracing.Integrations.Express({ app }),
                new Tracing.Integrations.Mysql(),
                new Integrations.RewriteFrames({
                    root: __dirname,
                }),
            ],
            tracesSampleRate: traceSampleRate,
            environment,
        });
        SentryNode.addGlobalEventProcessor((event) => {
            if (event.transaction) {
                // Rewrite things that look like IDs to `:id` for sentry
                event.transaction = event.transaction
                    .split("/")
                    .map((x) => (!parseInt(x) ? x : ":id"))
                    .join("/");
            }
            // TODO: does this even do anything?
            delete event.request?.cookies;
            if (event.request?.headers) {
                delete event.request.headers["X-Real-Ip"];
                delete event.request.headers["X-Forwarded-For"];
                delete event.request.headers["X-Forwarded-Host"];
                delete event.request.headers["X-Super-Properties"];
            }
            if (event.breadcrumbs) {
                event.breadcrumbs = event.breadcrumbs.filter((x) => {
                    // Filter breadcrumbs that we don't care about
                    if (x.message?.includes("identified as"))
                        return false;
                    if (x.message?.includes("[WebSocket] closed"))
                        return false;
                    if (x.message?.includes("Got Resume -> cancel not implemented"))
                        return false;
                    if (x.message?.includes("[Gateway] New connection from"))
                        return false;
                    return true;
                });
            }
            return event;
        });
        if (app) {
            app.use(SentryNode.Handlers.requestHandler());
            app.use(SentryNode.Handlers.tracingHandler());
        }
    },
    /** Call AFTER registering your routes */
    errorHandler: (app) => {
        if (!Config_1.Config.get().sentry.enabled)
            return;
        if (errorHandlersUsed)
            return;
        errorHandlersUsed = true;
        app.use(SentryNode.Handlers.errorHandler());
        // The typings for this are broken?
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        app.use(function onError(err, req, res, next) {
            res.statusCode = 500;
            res.end(res.sentry + "\n");
        });
    },
    close: () => {
        SentryNode.close();
    },
};
//# sourceMappingURL=Sentry.js.map