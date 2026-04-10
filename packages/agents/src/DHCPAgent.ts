import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';

export class DHCPAgent implements IAgent {
  readonly name = 'DHCPAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'dhcp_pool_create',
      description: 'Create a DHCP IP Pool',
      inputSchema: {
        type: 'object',
        properties: {
          deviceId: { type: 'string' },
          poolName: { type: 'string' },
          ranges: { type: 'string' }
        },
        required: ['deviceId', 'poolName', 'ranges']
      }
    }, this.createPool.bind(this));

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async createPool(inputs: any) {
    const db = getFirestore();
    await db.collection(`devices/${inputs.deviceId}/dhcp_pools`).doc(inputs.poolName).set({
      ranges: inputs.ranges,
      createdAt: new Date()
    });
    return { poolName: inputs.poolName, status: 'created' };
  }
}
