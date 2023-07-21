

import { Router, Request, Response } from "express";
import { User } from "@greektube/util";
import { route } from "@greektube/api";

const router: Router = Router();

router.get("/", route({}), async (req: Request, res: Response) => {
	const { id } = req.params;

	res.json(await User.getPublicUser(id));
});

export default router;
