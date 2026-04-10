"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
const mikrotik_1 = require("@agentclaw/mikrotik");
class SessionAgent {
    name = 'SessionAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'disconnect_user',
            description: 'Drop a user active connection based on IP or MAC',
            inputSchema: {
                type: 'object',
                properties: {
                    ip_address: { type: 'string' },
                    mac_address: { type: 'string' },
                    reason: { type: 'string' }
                }
            }
        }, this.disconnectUser.bind(this), this.name);
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async disconnectUser(inputs) {
        const { ip_address, mac_address, reason } = inputs;
        const db = (0, kernel_1.getFirestore)();
        // 1. Find the active session
        let query = db.collection('sessions').where('status', '==', 'ACTIVE');
        if (mac_address) {
            query = query.where('macAddress', '==', mac_address);
        }
        else if (ip_address) {
            query = query.where('ipAddress', '==', ip_address);
        }
        else {
            return { success: false, error: 'Either ip_address or mac_address required' };
        }
        const sessionQuery = await query.limit(1).get();
        if (sessionQuery.empty) {
            return { success: false, error: 'Active session not found' };
        }
        const sessionDoc = sessionQuery.docs[0];
        const session = sessionDoc.data();
        // 2. Hardware Kicking
        const hotspotSnap = await db.collection('hotspots').doc(session.hotspotId).get();
        if (hotspotSnap.exists) {
            const hotspot = hotspotSnap.data();
            if (hotspot.routerIp && hotspot.routerIp !== 'local') {
                try {
                    const client = new mikrotik_1.RouterOSClient(hotspot.routerIp, hotspot.apiPort, hotspot.apiUser, hotspot.apiPassword);
                    await client.connect();
                    // Find the active session ID in RouterOS by MAC or Username
                    const active = await client.getActiveSessions();
                    const target = active.find(s => s.macAddress === session.macAddress || s.user === session.voucherCode);
                    if (target) {
                        await client.kickSession(target.id);
                        kernel_1.logger.info(`Session kicked on hardware: ${session.macAddress} (${hotspot.routerIp})`);
                    }
                    await client.disconnect();
                }
                catch (err) {
                    kernel_1.logger.error(`Hardware kick failed for ${session.macAddress}: ${err.message}`);
                }
            }
        }
        // 3. Update DB
        await sessionDoc.ref.update({
            status: 'ENDED',
            endedReason: reason || 'manual',
            endedAt: new Date()
        });
        kernel_1.eventBus.publish('session:ended', { sessionId: sessionDoc.id, macAddress: session.macAddress, reason }, this.name);
        return { success: true, status: 'disconnected' };
    }
}
exports.SessionAgent = SessionAgent;
//# sourceMappingURL=SessionAgent.js.map