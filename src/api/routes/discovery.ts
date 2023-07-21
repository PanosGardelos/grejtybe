

import { Categories } from "@greektube/util";
import { Router, Response, Request } from "express";
import { route } from "@greektube/api";

const router = Router();

router.get("/categories", route({}), async (req: Request, res: Response) => {
	// TODO:
	// Get locale instead

	// const { locale, primary_only } = req.query;
	const { primary_only } = req.query;

	const out = primary_only
		? await Categories.find()
		: await Categories.find({ where: { is_primary: true } });

	res.send(out);
});

export default router;
