"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictiveAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class PredictiveAgent {
    name = 'PredictiveAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'predict_load',
            description: 'Predict network load for proactive voucher allocation',
            inputSchema: {
                type: 'object',
                properties: { hotspot_id: { type: 'string' } },
                required: ['hotspot_id']
            }
        }, this.predictLoad.bind(this));
        // Listen for session count updates to track load
        kernel_1.eventBus.on('hotspot:session-count', async (event) => {
            const { count } = event.payload;
            const threshold = 10; // Simple threshold for demo (e.g. 10 sessions)
            if (count > threshold) {
                kernel_1.logger.warn(`PredictiveAgent: High load detected (${count} sessions). Emitting alert...`);
                kernel_1.eventBus.publish('predictive:alert', {
                    level: 'HIGH',
                    sessions: count,
                    message: 'Hotspot approaching capacity threshold.'
                }, this.name);
            }
        });
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async predictLoad(inputs) {
        return {
            hotspotId: inputs.hotspot_id,
            predictedLoadPct: 85,
            suggestedAction: 'Allocate more bandwidth'
        };
    }
}
exports.PredictiveAgent = PredictiveAgent;
//# sourceMappingURL=PredictiveAgent.js.map