

import { route } from "@fosscord/api";
import { SecurityKey, User } from "@fosscord/util";
import { Request, Response, Router } from "express";
const router = Router();

router.delete("/", route({}), async (req: Request, res: Response) => {
	const { key_id } = req.params;

	await SecurityKey.delete({
		id: key_id,
		user_id: req.user_id,
	});

	const keys = await SecurityKey.count({ where: { user_id: req.user_id } });

	// disable webauthn if there are no keys left
	if (keys === 0)
		await User.update({ id: req.user_id }, { webauthn_enabled: false });

	res.sendStatus(204);
});

export default router;
