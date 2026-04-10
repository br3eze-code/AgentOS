import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';

export class DeviceAgent implements IAgent {
  readonly name = 'DeviceAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'device_status',
      description: 'Get device hardware status and uptime',
      inputSchema: {
        type: 'object',
        properties: { deviceId: { type: 'string' } },
        required: ['deviceId']
      }
    }, this.getStatus.bind(this));

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async getStatus(inputs: any) {
    const db = getFirestore();
    const snap = await db.collection('devices').doc(inputs.deviceId).get();
    if (!snap.exists) throw new Error('Device not found');
    return snap.data();
  }
}
