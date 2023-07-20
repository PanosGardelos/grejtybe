

import { Fido2Lib } from "fido2-lib";
import jwt from "jsonwebtoken";
import { Config } from "./Config";

const JWTOptions: jwt.SignOptions = {
	algorithm: "HS256",
	expiresIn: "5m",
};

export const WebAuthn: {
	fido2: Fido2Lib | null;
	init: () => void;
} = {
	fido2: null,
	init: function () {
		this.fido2 = new Fido2Lib({
			challengeSize: 128,
		});
	},
};

export async function generateWebAuthnTicket(
	challenge: string,
): Promise<string> {
	return new Promise((res, rej) => {
		jwt.sign(
			{ challenge },
			Config.get().security.jwtSecret,
			JWTOptions,
			(err, token) => {
				if (err || !token) return rej(err || "no token");
				return res(token);
			},
		);
	});
}

export async function verifyWebAuthnToken(token: string) {
	return new Promise((res, rej) => {
		jwt.verify(
			token,
			Config.get().security.jwtSecret,
			JWTOptions,
			async (err, decoded) => {
				if (err) return rej(err);
				return res(decoded);
			},
		);
	});
}
