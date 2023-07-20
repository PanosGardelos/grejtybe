

import { Request, Response, Router } from "express";
import FileType from "file-type";
import fs from "fs/promises";
import { HTTPError } from "lambert-server";
import { join } from "path";

const defaultAvatarHashMap = new Map([
	["0", "1f0bfc0865d324c2587920a7d80c609b"],
	["1", "c09a43a372ba81e3018c3151d4ed4773"],
	["2", "7c8f476123d28d103efe381543274c25"],
	["3", "6f26ddd1bf59740c536d2274bb834a05"],
	["4", "3c6ccb83716d1e4fb91d3082f6b21d77"],
	["5", "4c1b599b1ef5b9f1874fdb9933f3e03b"],
]);

const router = Router();

async function getFile(path: string) {
	try {
		return fs.readFile(path);
	} catch (error) {
		try {
			const files = await fs.readdir(path);
			if (!files.length) return null;
			return fs.readFile(join(path, files[0]));
		} catch (error) {
			return null;
		}
	}
}

router.get("/avatars/:id", async (req: Request, res: Response) => {
	let { id } = req.params;
	id = id.split(".")[0]; // remove .file extension
	const hash = defaultAvatarHashMap.get(id);
	if (!hash) throw new HTTPError("not found", 404);
	const path = join(process.cwd(), "assets", "public", `${hash}.png`);

	const file = await getFile(path);
	if (!file) throw new HTTPError("not found", 404);
	const type = await FileType.fromBuffer(file);

	res.set("Content-Type", type?.mime);
	res.set("Cache-Control", "public, max-age=31536000");

	return res.send(file);
});

export default router;
