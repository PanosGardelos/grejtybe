

import { WebSocket } from "@greektube/gateway";
import { Session } from "@greektube/util";

export async function onClose(this: WebSocket, code: number, reason: string) {
	console.log("[WebRTC] closed", code, reason.toString());

	if (this.session_id) await Session.delete({ session_id: this.session_id });
	this.removeAllListeners();
}
