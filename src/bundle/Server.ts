

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

import http from "http";
import * as Api from "@greektube/api";
import * as Gateway from "@greektube/gateway";
import { CDNServer } from "@greektube/cdn";
import express from "express";
import { green, bold } from "picocolors";
import { Config, initDatabase, Sentry } from "@greektube/util";

const app = express();
const server = http.createServer();
const port = Number(process.env.PORT) || 3001;
const production = process.env.NODE_ENV == "development" ? false : true;
server.on("request", app);

const api = new Api.FosscordServer({ server, port, production, app });
const cdn = new CDNServer({ server, port, production, app });
const gateway = new Gateway.Server({ server, port, production });

process.on("SIGTERM", async () => {
	console.log("Shutting down due to SIGTERM");
	await gateway.stop();
	await cdn.stop();
	await api.stop();
	server.close();
	Sentry.close();
});

async function main() {
	await initDatabase();
	await Config.init();
	await Sentry.init(app);

	server.listen(port);
	await Promise.all([api.start(), cdn.start(), gateway.start()]);

	Sentry.errorHandler(app);

	console.log(`[Server] ${green(`listening on port ${bold(port)}`)}`);
}

main().catch(console.error);
