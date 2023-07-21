"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdnConfiguration = void 0;
const EndpointConfiguration_1 = require("./EndpointConfiguration");
class CdnConfiguration extends EndpointConfiguration_1.EndpointConfiguration {
    resizeHeightMax = 1000;
    resizeWidthMax = 1000;
    imagorServerUrl = null;
    endpointPublic = null;
    endpointPrivate = null;
}
exports.CdnConfiguration = CdnConfiguration;
//# sourceMappingURL=CdnConfiguration.js.map