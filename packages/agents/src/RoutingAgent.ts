import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';

export class RoutingAgent implements IAgent {
  readonly name = 'RoutingAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
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

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async addRoute(inputs: any) {
    const { deviceId, destination, gateway } = inputs;
    const db = getFirestore();
    const routeRef = db.collection(`devices/${deviceId}/routes`).doc();
    await routeRef.set({ destination, gateway, type: 'static', createdAt: new Date() });
    return { routeId: routeRef.id, destination, gateway };
  }
}
