"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class InterfaceAgent {
    name = 'InterfaceAgent';
    async start() {
        // Register MCP Tools
        kernel_1.mcpRegistry.registerTool({
            name: 'interface_list',
            description: 'List all network interfaces on a device',
            inputSchema: { type: 'object', properties: { deviceId: { type: 'string' } }, required: ['deviceId'] }
        }, this.listInterfaces.bind(this));
        kernel_1.mcpRegistry.registerTool({
            name: 'interface_create_bridge',
            description: 'Create a network bridge',
            inputSchema: {
                type: 'object',
                properties: { deviceId: { type: 'string' }, bridgeName: { type: 'string' } },
                required: ['deviceId', 'bridgeName']
            }
        }, this.createBridge.bind(this));
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() {
        kernel_1.logger.info(`${this.name} stopped`);
    }
    async listInterfaces(inputs) {
        const { deviceId } = inputs;
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection(`devices/${deviceId}/interfaces`).get();
        return { interfaces: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
    }
    async createBridge(inputs) {
        const { deviceId, bridgeName } = inputs;
        const db = (0, kernel_1.getFirestore)();
        await db.collection(`devices/${deviceId}/interfaces`).doc(bridgeName).set({
            type: 'bridge',
            name: bridgeName,
            status: 'active',
            createdAt: new Date()
        });
        return { bridgeId: bridgeName, status: 'created' };
    }
}
exports.InterfaceAgent = InterfaceAgent;
//# sourceMappingURL=InterfaceAgent.js.map