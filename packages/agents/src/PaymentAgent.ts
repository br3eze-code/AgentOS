import { IAgent, mcpRegistry, getFirestore, eventBus, logger } from '@agentclaw/kernel';

export class PaymentAgent implements IAgent {
  readonly name = 'PaymentAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'process_payment',
      description: 'Process a payment for a voucher or plan',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string' },
          method: { type: 'string', enum: ['CASH', 'WALLET', 'STRIPE', 'ECOCASH'] },
          reference: { type: 'string' }
        },
        required: ['amount', 'currency', 'method']
      }
    }, this.processPayment.bind(this));

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async processPayment(inputs: any) {
    const db = getFirestore();
    const ref = db.collection('payments').doc();
    
    await ref.set({
      amount: inputs.amount,
      currency: inputs.currency || 'USD',
      method: inputs.method,
      reference: inputs.reference || '',
      status: 'COMPLETED',
      createdAt: new Date()
    });

    eventBus.publish('payment:completed', { paymentId: ref.id, amount: inputs.amount, method: inputs.method }, this.name);
    return { paymentId: ref.id, status: 'processed' };
  }
}
