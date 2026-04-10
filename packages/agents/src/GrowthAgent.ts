import { IAgent, mcpRegistry, getFirestore, eventBus, logger } from '@agentclaw/kernel';

export class GrowthAgent implements IAgent {
  readonly name = 'GrowthAgent';

  async start(): Promise<void> {
    // 1. Reactive Logic: Watch for payments to detect revenue trends
    eventBus.on('payment:completed', async (event) => {
      const { amount } = event.payload as any;
      await this.recordRevenue(amount);
    });

    // 2. Register MCP Tools
    mcpRegistry.registerTool({
      name: 'analyze_trends',
      description: 'Analyze usage trends and suggest pricing or locations',
      inputSchema: {
        type: 'object',
        properties: { region: { type: 'string' } },
        required: ['region']
      }
    }, this.analyzeTrends.bind(this));

    logger.info(`${this.name} started (listening for payment:completed)`);
  }

  async stop(): Promise<void> {}

  private async recordRevenue(amount: number) {
    const db = getFirestore();
    const today = new Date().toISOString().split('T')[0];
    const ref = db.collection('analytics').doc(`revenue_${today}`);
    
    // In a real system, we'd use a transaction or FieldValue.increment
    const snap = await ref.get();
    const current = snap.exists ? snap.data()?.total || 0 : 0;
    
    await ref.set({
      date: today,
      total: current + amount,
      lastUpdate: new Date()
    }, { merge: true });

    logger.debug(`GrowthAgent: Recorded revenue +${amount} (Total for ${today}: ${current + amount})`);
  }

  private async analyzeTrends(inputs: any) {
    return { 
      region: inputs.region, 
      suggestions: [
        'Increase price of 1HR plan by 10%', 
        'Deploy new hotspot in downtown area'
      ] 
    };
  }
}
