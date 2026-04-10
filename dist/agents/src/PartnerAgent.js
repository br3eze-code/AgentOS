"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class PartnerAgent {
    name = 'PartnerAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'register_partner',
            description: 'Register a new network deployment partner',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    revenue_share_pct: { type: 'number', description: '0 to 1, e.g. 0.70' }
                },
                required: ['name', 'revenue_share_pct']
            }
        }, this.registerPartner.bind(this));
        kernel_1.mcpRegistry.registerTool({
            name: 'calculate_payouts',
            description: 'Calculate pending partner payouts',
            inputSchema: {
                type: 'object',
                properties: { partner_id: { type: 'string' } },
                required: ['partner_id']
            }
        }, this.calculatePayouts.bind(this));
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async registerPartner(inputs) {
        const db = (0, kernel_1.getFirestore)();
        const ref = db.collection('partners').doc();
        await ref.set({
            name: inputs.name,
            revenueShare: inputs.revenue_share_pct,
            createdAt: new Date()
        });
        return { partnerId: ref.id, status: 'registered' };
    }
    async calculatePayouts(inputs) {
        // Stub implementation
        return { partnerId: inputs.partner_id, pendingPayout: 1540.50, currency: 'USD' };
    }
}
exports.PartnerAgent = PartnerAgent;
//# sourceMappingURL=PartnerAgent.js.map