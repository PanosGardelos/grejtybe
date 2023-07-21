"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterConfiguration = void 0;
const _1 = require(".");
class RegisterConfiguration {
    email = new _1.EmailConfiguration();
    dateOfBirth = new _1.DateOfBirthConfiguration();
    password = new _1.PasswordConfiguration();
    disabled = false;
    requireCaptcha = true;
    requireInvite = false;
    guestsRequireInvite = true;
    allowNewRegistration = true;
    allowMultipleAccounts = true;
    blockProxies = true;
    incrementingDiscriminators = false; // random otherwise
    defaultRights = "312119568366592"; // See `npm run generate:rights`
}
exports.RegisterConfiguration = RegisterConfiguration;
//# sourceMappingURL=RegisterConfiguration.js.map