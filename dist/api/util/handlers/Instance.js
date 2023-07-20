"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.initInstance = void 0;
const util_1 = require("@fosscord/util");
async function initInstance() {
    // TODO: clean up database and delete tombstone data
    // TODO: set first user as instance administrator/or generate one if none exists and output it in the terminal
    // create default guild and add it to auto join
    // TODO: check if any current user is not part of autoJoinGuilds
    // const { autoJoin } = Config.get().guild;
    // if (autoJoin.enabled && !autoJoin.guilds?.length) {
    // 	const guild = await Guild.findOne({ where: {}, select: ["id"] });
    // 	if (guild) {
    // 		await Config.set({ guild: { autoJoin: { guilds: [guild.id] } } });
    // 	}
    // }
    // TODO: do no clear sessions for instance cluster
    await util_1.Session.delete({});
}
exports.initInstance = initInstance;
//# sourceMappingURL=Instance.js.map