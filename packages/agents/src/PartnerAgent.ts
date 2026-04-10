import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';

export class PartnerAgent implements IAgent {
  readonly name = 'PartnerAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'register_partner',
      description: 'Register a new network deployment partner',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          revenue_share_pct: { type: 'number', description: '0 to 1, e.g. 0.70' }
        },
        required: ['name', 'revenue_share_pct']
      }
    }, this.registerPartner.bind(this));

    mcpRegistry.registerTool({
      name: 'calculate_payouts',
      description: 'Calculate pending partner payouts',
      inputSchema: {
        type: 'object',
        properties: { partner_id: { type: 'string' } },
        required: ['partner_id']
      }
    }, this.calculatePayouts.bind(this));

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async registerPartner(inputs: any) {
    const db = getFirestore();
    const ref = db.collection('partners').doc();
    await ref.set({
      name: inputs.name,
      revenueShare: inputs.revenue_share_pct,
      createdAt: new Date()
    });
    return { partnerId: ref.id, status: 'registered' };
  }

  private async calculatePayouts(inputs: any) {
    // Stub implementation
    return { partnerId: inputs.partner_id, pendingPayout: 1540.50, currency: 'USD' };
  }
}
