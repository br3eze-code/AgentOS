"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadiusAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
const mikrotik_1 = require("@agentclaw/mikrotik");
class RadiusAgent {
    name = 'RadiusAgent';
    adapter;
    constructor() {
        this.adapter = new mikrotik_1.RadiusAdapter(1812, process.env.RADIUS_SECRET || 'agentclaw-secret');
    }
    async start() {
        // 1. Start the RADIUS UDP server
        this.adapter.start();
        // 2. Register MCP Tool for manual auth checks
        kernel_1.mcpRegistry.registerTool({
            name: 'radius_auth',
            description: 'Manually authenticate a RADIUS request (for testing)',
            inputSchema: {
                type: 'object',
                properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                },
                required: ['username', 'password']
            }
        }, this.authenticate.bind(this));
        kernel_1.logger.info(`${this.name} started (UDP port 1812)`);
    }
    async stop() {
        this.adapter.stop();
        kernel_1.logger.info(`${this.name} stopped`);
    }
    async authenticate(inputs) {
        // Basic RADIUS auth logic integrating with Firestore vouchers
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('vouchers').where('code', '==', inputs.username).limit(1).get();
        if (!snap.empty) {
            const voucher = snap.docs[0].data();
            if (voucher.status === 'ACTIVE' || voucher.status === 'NEW') {
                return { status: 'Access-Accept' };
            }
        }
        return { status: 'Access-Reject' };
    }
}
exports.RadiusAgent = RadiusAgent;
//# sourceMappingURL=RadiusAgent.js.map