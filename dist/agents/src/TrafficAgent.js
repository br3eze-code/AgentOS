"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class TrafficAgent {
    name = 'TrafficAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'traffic_set_queue',
            description: 'Set a bandwidth queue limit for an IP',
            inputSchema: {
                type: 'object',
                properties: {
                    deviceId: { type: 'string' },
                    targetIp: { type: 'string' },
                    maxLimitKbps: { type: 'number' }
                },
                required: ['deviceId', 'targetIp', 'maxLimitKbps']
            }
        }, this.setQueue.bind(this));
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async setQueue(inputs) {
        const db = (0, kernel_1.getFirestore)();
        const ref = db.collection(`devices/${inputs.deviceId}/queues`).doc(inputs.targetIp.replace(/\./g, '_'));
        await ref.set({
            targetIp: inputs.targetIp,
            maxLimitKbps: inputs.maxLimitKbps,
            updatedAt: new Date()
        });
        return { target: inputs.targetIp, status: 'limited' };
    }
}
exports.TrafficAgent = TrafficAgent;
//# sourceMappingURL=TrafficAgent.js.map