"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoamingAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class RoamingAgent {
    name = 'RoamingAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'roam_session',
            description: 'Migrate a user session between hotspots using voucher code',
            inputSchema: {
                type: 'object',
                properties: {
                    code: { type: 'string' },
                    mac_address: { type: 'string' },
                    new_hotspot_id: { type: 'string' }
                },
                required: ['code', 'mac_address', 'new_hotspot_id']
            }
        }, this.roamSession.bind(this));
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async roamSession(inputs) {
        const { code, mac_address, new_hotspot_id } = inputs;
        const db = (0, kernel_1.getFirestore)();
        // Find active session by voucher code and MAC address
        const sessionSnap = await db.collection('sessions')
            .where('voucherCode', '==', code)
            .where('macAddress', '==', mac_address)
            .where('status', '==', 'ACTIVE')
            .limit(1)
            .get();
        if (sessionSnap.empty) {
            throw new Error(`No active session found for voucher ${code} and device ${mac_address}`);
        }
        const sessionDoc = sessionSnap.docs[0];
        const oldHotspot = sessionDoc.data()?.hotspotId;
        await sessionDoc.ref.update({
            hotspotId: new_hotspot_id,
            lastRoamedAt: new Date()
        });
        kernel_1.logger.info(`Session ${sessionDoc.id} roamed from ${oldHotspot} to ${new_hotspot_id}`);
        return {
            sessionId: sessionDoc.id,
            oldHotspot,
            newHotspot: new_hotspot_id,
            status: 'migrated'
        };
    }
}
exports.RoamingAgent = RoamingAgent;
//# sourceMappingURL=RoamingAgent.js.map