"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
const uuid_1 = require("uuid");
class PlanAgent {
    name = 'PlanAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'create_plan',
            description: 'Create a new WiFi billing plan',
            inputSchema: {
                type: 'object',
                properties: {
                    plan_name: { type: 'string' },
                    price: { type: 'number' },
                    duration_hours: { type: 'integer' },
                    bandwidth_limit_kbps: { type: 'integer' }
                },
                required: ['plan_name', 'price', 'duration_hours']
            }
        }, this.createPlan.bind(this));
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async createPlan(inputs) {
        const db = (0, kernel_1.getFirestore)();
        const planId = 'pl_' + (0, uuid_1.v4)().split('-')[0];
        await db.collection('plans').doc(planId).set({
            name: inputs.plan_name,
            price: inputs.price,
            durationHours: inputs.duration_hours,
            bandwidthLimitKbps: inputs.bandwidth_limit_kbps || 0,
            active: true,
            createdAt: new Date()
        });
        return { plan_id: planId, status: 'created' };
    }
}
exports.PlanAgent = PlanAgent;
//# sourceMappingURL=PlanAgent.js.map