import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';

export class FirewallAgent implements IAgent {
  readonly name = 'FirewallAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'firewall_add_rule',
      description: 'Add a firewall filter rule',
      inputSchema: {
        type: 'object',
        properties: {
          deviceId: { type: 'string' },
          chain: { type: 'string', enum: ['input', 'forward', 'output'] },
          action: { type: 'string', enum: ['accept', 'drop', 'reject'] },
          srcAddress: { type: 'string' }
        },
        required: ['deviceId', 'chain', 'action']
      }
    }, this.addRule.bind(this));

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async addRule(inputs: any) {
    const db = getFirestore();
    const ref = db.collection(`devices/${inputs.deviceId}/firewall`).doc();
    await ref.set({ ...inputs, createdAt: new Date() });
    return { ruleId: ref.id, status: 'active' };
  }
}
