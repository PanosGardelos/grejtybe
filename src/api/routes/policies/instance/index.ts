

import { Router, Request, Response } from "express";
import { route } from "@greektube/api";
import { Config } from "@greektube/util";
const router = Router();

router.get("/", route({}), async (req: Request, res: Response) => {
	const { general } = Config.get();
	res.json(general);
});

export default router;
