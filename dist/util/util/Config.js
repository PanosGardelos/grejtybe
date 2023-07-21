"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const tslib_1 = require("tslib");
const Config_1 = require("../entities/Config");
const promises_1 = tslib_1.__importDefault(require("fs/promises"));
const fs_1 = require("fs");
const config_1 = require("../config");
const __1 = require("..");
// TODO: yaml instead of json
const overridePath = process.env.CONFIG_PATH ?? "";
let config;
let pairs;
// TODO: use events to inform about config updates
// Config keys are separated with _
exports.Config = {
    init: async function init() {
        if (config)
            return config;
        console.log("[Config] Loading configuration...");
        if (!process.env.CONFIG_PATH) {
            pairs = await Config_1.ConfigEntity.find();
            config = pairsToConfig(pairs);
        }
        else {
            console.log(`[Config] Using CONFIG_PATH rather than database`);
            if ((0, fs_1.existsSync)(process.env.CONFIG_PATH)) {
                const file = JSON.parse((await promises_1.default.readFile(process.env.CONFIG_PATH)).toString());
                config = file;
            }
            else
                config = new config_1.ConfigValue();
            pairs = generatePairs(config);
        }
        // If a config doesn't exist, create it.
        if (Object.keys(config).length == 0)
            config = new config_1.ConfigValue();
        config = __1.OrmUtils.mergeDeep({}, { ...new config_1.ConfigValue() }, config);
        return this.set(config);
    },
    get: function get() {
        if (!config) {
            // If we haven't initialised the config yet, return default config.
            // Typeorm instantiates each entity once when initising database,
            // which means when we use config values as default values in entity classes,
            // the config isn't initialised yet and would throw an error about the config being undefined.
            return new config_1.ConfigValue();
        }
        return config;
    },
    set: function set(val) {
        if (!config || !val)
            return;
        config = val.merge(config);
        return applyConfig(config);
    },
};
// TODO: better types
const generatePairs = (obj, key = "") => {
    if (typeof obj == "object" && obj != null) {
        return Object.keys(obj)
            .map((k) => 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        generatePairs(obj[k], key ? `${key}_${k}` : k))
            .flat();
    }
    const ret = new Config_1.ConfigEntity();
    ret.key = key;
    ret.value = obj;
    return [ret];
};
async function applyConfig(val) {
    if (process.env.CONFIG_PATH)
        await promises_1.default.writeFile(overridePath, JSON.stringify(val, null, 4));
    else {
        const pairs = generatePairs(val);
        await Promise.all(pairs.map((pair) => pair.save()));
    }
    return val;
}
function pairsToConfig(pairs) {
    // TODO: typings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = {};
    pairs.forEach((p) => {
        const keys = p.key.split("_");
        let obj = value;
        let prev = "";
        let prevObj = obj;
        let i = 0;
        for (const key of keys) {
            if (!isNaN(Number(key)) && !prevObj[prev]?.length)
                prevObj[prev] = obj = [];
            if (i++ === keys.length - 1)
                obj[key] = p.value;
            else if (!obj[key])
                obj[key] = {};
            prev = key;
            prevObj = obj;
            obj = obj[key];
        }
    });
    return value;
}
//# sourceMappingURL=Config.js.map