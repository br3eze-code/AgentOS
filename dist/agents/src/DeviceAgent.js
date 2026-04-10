"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class DeviceAgent {
    name = 'DeviceAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'device_status',
            description: 'Get device hardware status and uptime',
            inputSchema: {
                type: 'object',
                properties: { deviceId: { type: 'string' } },
                required: ['deviceId']
            }
        }, this.getStatus.bind(this));
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async getStatus(inputs) {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('devices').doc(inputs.deviceId).get();
        if (!snap.exists)
            throw new Error('Device not found');
        return snap.data();
    }
}
exports.DeviceAgent = DeviceAgent;
//# sourceMappingURL=DeviceAgent.js.map