"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyParser = void 0;
const tslib_1 = require("tslib");
const body_parser_1 = tslib_1.__importDefault(require("body-parser"));
const lambert_server_1 = require("lambert-server");
function BodyParser(opts) {
    const jsonParser = body_parser_1.default.json(opts);
    return (req, res, next) => {
        if (!req.headers["content-type"])
            req.headers["content-type"] = "application/json";
        jsonParser(req, res, (err) => {
            if (err) {
                // TODO: different errors for body parser (request size limit, wrong body type, invalid body, ...)
                return next(new lambert_server_1.HTTPError("Invalid Body", 400));
            }
            next();
        });
    };
}
exports.BodyParser = BodyParser;
//# sourceMappingURL=BodyParser.js.map