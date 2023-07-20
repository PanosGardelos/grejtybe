"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const file_type_1 = tslib_1.__importDefault(require("file-type"));
const promises_1 = tslib_1.__importDefault(require("fs/promises"));
const lambert_server_1 = require("lambert-server");
const path_1 = require("path");
const defaultAvatarHashMap = new Map([
    ["0", "1f0bfc0865d324c2587920a7d80c609b"],
    ["1", "c09a43a372ba81e3018c3151d4ed4773"],
    ["2", "7c8f476123d28d103efe381543274c25"],
    ["3", "6f26ddd1bf59740c536d2274bb834a05"],
    ["4", "3c6ccb83716d1e4fb91d3082f6b21d77"],
    ["5", "4c1b599b1ef5b9f1874fdb9933f3e03b"],
]);
const router = (0, express_1.Router)();
async function getFile(path) {
    try {
        return promises_1.default.readFile(path);
    }
    catch (error) {
        try {
            const files = await promises_1.default.readdir(path);
            if (!files.length)
                return null;
            return promises_1.default.readFile((0, path_1.join)(path, files[0]));
        }
        catch (error) {
            return null;
        }
    }
}
router.get("/avatars/:id", async (req, res) => {
    let { id } = req.params;
    id = id.split(".")[0]; // remove .file extension
    const hash = defaultAvatarHashMap.get(id);
    if (!hash)
        throw new lambert_server_1.HTTPError("not found", 404);
    const path = (0, path_1.join)(process.cwd(), "assets", "public", `${hash}.png`);
    const file = await getFile(path);
    if (!file)
        throw new lambert_server_1.HTTPError("not found", 404);
    const type = await file_type_1.default.fromBuffer(file);
    res.set("Content-Type", type?.mime);
    res.set("Cache-Control", "public, max-age=31536000");
    return res.send(file);
});
exports.default = router;
//# sourceMappingURL=embed.js.map