

import { Router, Request, Response } from "express";
import { getIpAdress, route } from "@greektube/api";
import { getVoiceRegions } from "@greektube/api";

const router: Router = Router();

router.get("/", route({}), async (req: Request, res: Response) => {
	res.json(await getVoiceRegions(getIpAdress(req), true)); //vip true?
});

export default router;
