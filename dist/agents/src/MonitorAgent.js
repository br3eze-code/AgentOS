"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class MonitorAgent {
    name = 'MonitorAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'get_telemetry',
            description: 'Collect telemetry data from a hotspot or network node',
            inputSchema: {
                type: 'object',
                properties: { target_id: { type: 'string' } },
                required: ['target_id']
            }
        }, this.getTelemetry.bind(this));
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async getTelemetry(inputs) {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('telemetry').doc(inputs.target_id).get();
        return snap.exists ? snap.data() : { error: 'No telemetry data found' };
    }
}
exports.MonitorAgent = MonitorAgent;
//# sourceMappingURL=MonitorAgent.js.map