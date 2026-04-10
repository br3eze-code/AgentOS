import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';

export class TrafficAgent implements IAgent {
  readonly name = 'TrafficAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'traffic_set_queue',
      description: 'Set a bandwidth queue limit for an IP',
      inputSchema: {
        type: 'object',
        properties: {
          deviceId: { type: 'string' },
          targetIp: { type: 'string' },
          maxLimitKbps: { type: 'number' }
        },
        required: ['deviceId', 'targetIp', 'maxLimitKbps']
      }
    }, this.setQueue.bind(this));

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async setQueue(inputs: any) {
    const db = getFirestore();
    const ref = db.collection(`devices/${inputs.deviceId}/queues`).doc(inputs.targetIp.replace(/\./g, '_'));
    await ref.set({
      targetIp: inputs.targetIp,
      maxLimitKbps: inputs.maxLimitKbps,
      updatedAt: new Date()
    });
    return { target: inputs.targetIp, status: 'limited' };
  }
}
