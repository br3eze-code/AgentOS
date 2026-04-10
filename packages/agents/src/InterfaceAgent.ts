import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';

export class InterfaceAgent implements IAgent {
  readonly name = 'InterfaceAgent';

  async start(): Promise<void> {
    // Register MCP Tools
    mcpRegistry.registerTool({
      name: 'interface_list',
      description: 'List all network interfaces on a device',
      inputSchema: { type: 'object', properties: { deviceId: { type: 'string' } }, required: ['deviceId'] }
    }, this.listInterfaces.bind(this));

    mcpRegistry.registerTool({
      name: 'interface_create_bridge',
      description: 'Create a network bridge',
      inputSchema: { 
        type: 'object', 
        properties: { deviceId: { type: 'string' }, bridgeName: { type: 'string' } }, 
        required: ['deviceId', 'bridgeName'] 
      }
    }, this.createBridge.bind(this));

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {
    logger.info(`${this.name} stopped`);
  }

  private async listInterfaces(inputs: any) {
    const { deviceId } = inputs;
    const db = getFirestore();
    const snap = await db.collection(`devices/${deviceId}/interfaces`).get();
    return { interfaces: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  }

  private async createBridge(inputs: any) {
    const { deviceId, bridgeName } = inputs;
    const db = getFirestore();
    await db.collection(`devices/${deviceId}/interfaces`).doc(bridgeName).set({
      type: 'bridge',
      name: bridgeName,
      status: 'active',
      createdAt: new Date()
    });
    return { bridgeId: bridgeName, status: 'created' };
  }
}
