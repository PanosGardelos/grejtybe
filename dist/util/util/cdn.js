"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.handleFile = exports.uploadFile = void 0;
const tslib_1 = require("tslib");
const form_data_1 = tslib_1.__importDefault(require("form-data"));
const lambert_server_1 = require("lambert-server");
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const Config_1 = require("./Config");
async function uploadFile(path, 
// These are the only props we use, don't need to enforce the full type.
file) {
    if (!file?.buffer)
        throw new lambert_server_1.HTTPError("Missing file in body");
    const form = new form_data_1.default();
    form.append("file", file.buffer, {
        contentType: file.mimetype,
        filename: file.originalname,
    });
    const response = await (0, node_fetch_1.default)(`${Config_1.Config.get().cdn.endpointPrivate || "http://localhost:3001"}${path}`, {
        headers: {
            signature: Config_1.Config.get().security.requestSignature,
            ...form.getHeaders(),
        },
        method: "POST",
        body: form,
    });
    const result = (await response.json());
    if (response.status !== 200)
        throw result;
    return result;
}
exports.uploadFile = uploadFile;
async function handleFile(path, body) {
    if (!body || !body.startsWith("data:"))
        return undefined;
    try {
        const mimetype = body.split(":")[1].split(";")[0];
        const buffer = Buffer.from(body.split(",")[1], "base64");
        const { id } = await uploadFile(path, {
            buffer,
            mimetype,
            originalname: "banner",
        });
        return id;
    }
    catch (error) {
        console.error(error);
        throw new lambert_server_1.HTTPError("Invalid " + path);
    }
}
exports.handleFile = handleFile;
async function deleteFile(path) {
    const response = await (0, node_fetch_1.default)(`${Config_1.Config.get().cdn.endpointPrivate || "http://localhost:3001"}${path}`, {
        headers: {
            signature: Config_1.Config.get().security.requestSignature,
        },
        method: "DELETE",
    });
    const result = await response.json();
    if (response.status !== 200)
        throw result;
    return result;
}
exports.deleteFile = deleteFile;
//# sourceMappingURL=cdn.js.map