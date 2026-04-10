"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DHCPAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class DHCPAgent {
    name = 'DHCPAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'dhcp_pool_create',
            description: 'Create a DHCP IP Pool',
            inputSchema: {
                type: 'object',
                properties: {
                    deviceId: { type: 'string' },
                    poolName: { type: 'string' },
                    ranges: { type: 'string' }
                },
                required: ['deviceId', 'poolName', 'ranges']
            }
        }, this.createPool.bind(this));
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async createPool(inputs) {
        const db = (0, kernel_1.getFirestore)();
        await db.collection(`devices/${inputs.deviceId}/dhcp_pools`).doc(inputs.poolName).set({
            ranges: inputs.ranges,
            createdAt: new Date()
        });
        return { poolName: inputs.poolName, status: 'created' };
    }
}
exports.DHCPAgent = DHCPAgent;
//# sourceMappingURL=DHCPAgent.js.map