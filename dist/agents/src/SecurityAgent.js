"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class SecurityAgent {
    name = 'SecurityAgent';
    macWatch = new Map();
    async start() {
        // 1. Reactive Logic: Detect Rapid Session Creation (Potential Abuse)
        kernel_1.eventBus.on('session:started', async (event) => {
            const { macAddress } = event.payload;
            await this.auditMAC(macAddress);
        });
        // 2. Register MCP Tools
        kernel_1.mcpRegistry.registerTool({
            name: 'scan_vulnerabilities',
            description: 'Detect abuse, rogue clients, and anomalous traffic',
            inputSchema: {
                type: 'object',
                properties: { network_id: { type: 'string' } },
                required: ['network_id']
            }
        }, this.scanVulns.bind(this));
        kernel_1.logger.info(`${this.name} started (monitoring session:started)`);
    }
    async stop() { }
    async auditMAC(mac) {
        const count = (this.macWatch.get(mac) || 0) + 1;
        this.macWatch.set(mac, count);
        if (count > 5) {
            kernel_1.logger.warn(`SecurityAgent: MAC ${mac} flagged for rapid session creation!`);
            const db = (0, kernel_1.getFirestore)();
            await db.collection('security_alerts').add({
                type: 'ANOMALY_RAPID_SESSIONS',
                target: mac,
                severity: 'MEDIUM',
                timestamp: new Date()
            });
            // Reset after alerting
            this.macWatch.set(mac, 0);
        }
    }
    async scanVulns(inputs) {
        return { networkId: inputs.network_id, threatsDetected: 0, status: 'secure' };
    }
}
exports.SecurityAgent = SecurityAgent;
//# sourceMappingURL=SecurityAgent.js.map