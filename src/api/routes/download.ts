

import { Router, Response, Request } from "express";
import { route } from "@greektube/api";
import { FieldErrors, Release } from "@greektube/util";

const router = Router();

router.get("/", route({}), async (req: Request, res: Response) => {
	const { platform } = req.query;

	if (!platform)
		throw FieldErrors({
			platform: {
				code: "BASE_TYPE_REQUIRED",
				message: req.t("common:field.BASE_TYPE_REQUIRED"),
			},
		});

	const release = await Release.findOneOrFail({
		where: {
			enabled: true,
			platform: platform as string,
		},
		order: { pub_date: "DESC" },
	});

	res.redirect(release.url);
});

export default router;
