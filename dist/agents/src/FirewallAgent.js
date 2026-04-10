"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirewallAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class FirewallAgent {
    name = 'FirewallAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'firewall_add_rule',
            description: 'Add a firewall filter rule',
            inputSchema: {
                type: 'object',
                properties: {
                    deviceId: { type: 'string' },
                    chain: { type: 'string', enum: ['input', 'forward', 'output'] },
                    action: { type: 'string', enum: ['accept', 'drop', 'reject'] },
                    srcAddress: { type: 'string' }
                },
                required: ['deviceId', 'chain', 'action']
            }
        }, this.addRule.bind(this));
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async addRule(inputs) {
        const db = (0, kernel_1.getFirestore)();
        const ref = db.collection(`devices/${inputs.deviceId}/firewall`).doc();
        await ref.set({ ...inputs, createdAt: new Date() });
        return { ruleId: ref.id, status: 'active' };
    }
}
exports.FirewallAgent = FirewallAgent;
//# sourceMappingURL=FirewallAgent.js.map