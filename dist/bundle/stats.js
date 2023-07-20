"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.initStats = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const node_os_utils_1 = tslib_1.__importDefault(require("node-os-utils"));
const picocolors_1 = require("picocolors");
function initStats() {
    console.log(`[Path] running in ${__dirname}`);
    try {
        console.log(`[CPU] ${node_os_utils_1.default.cpu.model()} Cores x${node_os_utils_1.default.cpu.count()}`);
    }
    catch {
        console.log("[CPU] Failed to get cpu model!");
    }
    console.log(`[System] ${os_1.default.platform()} ${os_1.default.arch()}`);
    console.log(`[Process] running with PID: ${process.pid}`);
    if (process.getuid && process.getuid() === 0) {
        console.warn((0, picocolors_1.red)(`[Process] Warning fosscord is running as root, this highly discouraged and might expose your system vulnerable to attackers. Please run fosscord as a user without root privileges.`));
    }
    // TODO: node-os-utils might have a memory leak, more investigation needed
    // TODO: doesn't work if spawned with multiple threads
    // setInterval(async () => {
    // 	const [cpuUsed, memory, network] = await Promise.all([
    // 		osu.cpu.usage(),
    // 		osu.mem.info(),
    // 		osu.netstat.inOut(),
    // 	]);
    // 	var networkUsage = "";
    // 	if (typeof network === "object") {
    // 		networkUsage = `| [Network]: in ${network.total.inputMb}mb | out ${network.total.outputMb}mb`;
    // 	}
    // 	console.log(
    // 		`[CPU] ${cpuUsed.toPrecision(3)}% | [Memory] ${Math.round(
    // 			process.memoryUsage().rss / 1024 / 1024
    // 		)}mb/${memory.totalMemMb.toFixed(0)}mb ${networkUsage}`
    // 	);
    // }, 1000 * 60 * 5);
}
exports.initStats = initStats;
//# sourceMappingURL=stats.js.map