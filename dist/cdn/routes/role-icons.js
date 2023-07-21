"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const util_1 = require("@greektube/util");
const Storage_1 = require("../util/Storage");
const file_type_1 = tslib_1.__importDefault(require("file-type"));
const lambert_server_1 = require("lambert-server");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const multer_1 = require("../util/multer");
//Role icons ---> avatars.ts modified
// TODO: check user rights and perks and animated pfp are allowed in the policies
// TODO: generate different sizes of icon
// TODO: generate different image types of icon
const STATIC_MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "image/svg",
];
const ALLOWED_MIME_TYPES = [...STATIC_MIME_TYPES];
const router = (0, express_1.Router)();
router.post("/:role_id", multer_1.multer.single("file"), async (req, res) => {
    if (req.headers.signature !== util_1.Config.get().security.requestSignature)
        throw new lambert_server_1.HTTPError("Invalid request signature");
    if (!req.file)
        throw new lambert_server_1.HTTPError("Missing file");
    const { buffer, size } = req.file;
    const { role_id } = req.params;
    const hash = crypto_1.default
        .createHash("md5")
        .update(util_1.Snowflake.generate())
        .digest("hex");
    const type = await file_type_1.default.fromBuffer(buffer);
    if (!type || !ALLOWED_MIME_TYPES.includes(type.mime))
        throw new lambert_server_1.HTTPError("Invalid file type");
    const path = `role-icons/${role_id}/${hash}.png`;
    const endpoint = util_1.Config.get().cdn.endpointPublic || "http://localhost:10000";
    await Storage_1.storage.set(path, buffer);
    return res.json({
        id: hash,
        content_type: type.mime,
        size,
        url: `${endpoint}${req.baseUrl}/${role_id}/${hash}`,
    });
});
router.get("/:role_id", async (req, res) => {
    const { role_id } = req.params;
    //role_id = role_id.split(".")[0]; // remove .file extension
    const path = `role-icons/${role_id}`;
    const file = await Storage_1.storage.get(path);
    if (!file)
        throw new lambert_server_1.HTTPError("not found", 404);
    const type = await file_type_1.default.fromBuffer(file);
    res.set("Content-Type", type?.mime);
    res.set("Cache-Control", "public, max-age=31536000, must-revalidate");
    return res.send(file);
});
router.get("/:role_id/:hash", async (req, res) => {
    const { role_id, hash } = req.params;
    //hash = hash.split(".")[0]; // remove .file extension
    const path = `role-icons/${role_id}/${hash}`;
    const file = await Storage_1.storage.get(path);
    if (!file)
        throw new lambert_server_1.HTTPError("not found", 404);
    const type = await file_type_1.default.fromBuffer(file);
    res.set("Content-Type", type?.mime);
    res.set("Cache-Control", "public, max-age=31536000, must-revalidate");
    return res.send(file);
});
router.delete("/:role_id/:id", async (req, res) => {
    if (req.headers.signature !== util_1.Config.get().security.requestSignature)
        throw new lambert_server_1.HTTPError("Invalid request signature");
    const { role_id, id } = req.params;
    const path = `role-icons/${role_id}/${id}`;
    await Storage_1.storage.delete(path);
    return res.send({ success: true });
});
exports.default = router;
//# sourceMappingURL=role-icons.js.map