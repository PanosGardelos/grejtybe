

import { route } from "@greektube/api";
import {
	generateToken,
	SecurityKey,
	User,
	verifyWebAuthnToken,
	WebAuthn,
	WebAuthnTotpSchema,
} from "@greektube/util";
import { Request, Response, Router } from "express";
import { ExpectedAssertionResult } from "fido2-lib";
import { HTTPError } from "lambert-server";
const router = Router();

function toArrayBuffer(buf: Buffer) {
	const ab = new ArrayBuffer(buf.length);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buf.length; ++i) {
		view[i] = buf[i];
	}
	return ab;
}

router.post(
	"/",
	route({ body: "WebAuthnTotpSchema" }),
	async (req: Request, res: Response) => {
		if (!WebAuthn.fido2) {
			// TODO: I did this for typescript and I can't use !
			throw new Error("WebAuthn not enabled");
		}

		const { code, ticket } = req.body as WebAuthnTotpSchema;

		const user = await User.findOneOrFail({
			where: {
				totp_last_ticket: ticket,
			},
			select: ["id", "settings"],
		});

		const ret = await verifyWebAuthnToken(ticket);
		if (!ret)
			throw new HTTPError(req.t("auth:login.INVALID_TOTP_CODE"), 60008);

		await User.update({ id: user.id }, { totp_last_ticket: "" });

		const clientAttestationResponse = JSON.parse(code);

		if (!clientAttestationResponse.rawId)
			throw new HTTPError("Missing rawId", 400);

		clientAttestationResponse.rawId = toArrayBuffer(
			Buffer.from(clientAttestationResponse.rawId, "base64url"),
		);

		const securityKey = await SecurityKey.findOneOrFail({
			where: {
				key_id: Buffer.from(
					clientAttestationResponse.rawId,
					"base64url",
				).toString("base64"),
			},
		});

		const assertionExpectations: ExpectedAssertionResult = JSON.parse(
			Buffer.from(
				clientAttestationResponse.response.clientDataJSON,
				"base64",
			).toString(),
		);

		const authnResult = await WebAuthn.fido2.assertionResult(
			clientAttestationResponse,
			{
				...assertionExpectations,
				factor: "second",
				publicKey: securityKey.public_key,
				prevCounter: securityKey.counter,
				userHandle: securityKey.key_id,
			},
		);

		const counter = authnResult.authnrData.get("counter");

		securityKey.counter = counter;

		await securityKey.save();

		return res.json({
			token: await generateToken(user.id),
			user_settings: user.settings,
		});
	},
);

export default router;
