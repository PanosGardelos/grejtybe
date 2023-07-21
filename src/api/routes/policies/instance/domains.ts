

import { Router, Request, Response } from "express";
import { route } from "@greektube/api";
import { Config } from "@greektube/util";
const router = Router();

router.get("/", route({}), async (req: Request, res: Response) => {
	const { cdn, gateway, api } = Config.get();

	const IdentityForm = {
		cdn: cdn.endpointPublic || process.env.CDN || "http://localhost:3001",
		gateway:
			gateway.endpointPublic ||
			process.env.GATEWAY ||
			"ws://localhost:3001",
		defaultApiVersion: api.defaultVersion ?? 9,
		apiEndpoint: api.endpointPublic ?? "/api",
	};

	res.json(IdentityForm);
});

export default router;
