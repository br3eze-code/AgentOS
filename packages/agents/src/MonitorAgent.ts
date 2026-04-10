import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';

export class MonitorAgent implements IAgent {
  readonly name = 'MonitorAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'get_telemetry',
      description: 'Collect telemetry data from a hotspot or network node',
      inputSchema: {
        type: 'object',
        properties: { target_id: { type: 'string' } },
        required: ['target_id']
      }
    }, this.getTelemetry.bind(this));

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async getTelemetry(inputs: any) {
    const db = getFirestore();
    const snap = await db.collection('telemetry').doc(inputs.target_id).get();
    return snap.exists ? snap.data() : { error: 'No telemetry data found' };
  }
}
