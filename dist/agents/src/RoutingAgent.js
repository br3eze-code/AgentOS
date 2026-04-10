"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class RoutingAgent {
    name = 'RoutingAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'route_add',
            description: 'Add a static route',
            inputSchema: {
                type: 'object',
                properties: {
                    deviceId: { type: 'string' },
                    destination: { type: 'string' },
                    gateway: { type: 'string' }
                },
                required: ['deviceId', 'destination', 'gateway']
            }
        }, this.addRoute.bind(this));
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async addRoute(inputs) {
        const { deviceId, destination, gateway } = inputs;
        const db = (0, kernel_1.getFirestore)();
        const routeRef = db.collection(`devices/${deviceId}/routes`).doc();
        await routeRef.set({ destination, gateway, type: 'static', createdAt: new Date() });
        return { routeId: routeRef.id, destination, gateway };
    }
}
exports.RoutingAgent = RoutingAgent;
//# sourceMappingURL=RoutingAgent.js.map