import { IAgent, mcpRegistry, getFirestore, eventBus, logger, cronManager } from '@agentclaw/kernel';
import crypto from 'crypto';

export class VoucherAgent implements IAgent {
  readonly name = 'VoucherAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'generate_vouchers',
      description: 'Generate batch voucher codes',
      inputSchema: {
        type: 'object',
        properties: {
          plan_id: { type: 'string' },
          quantity: { type: 'integer' }
        },
        required: ['plan_id', 'quantity']
      }
    }, this.generateVouchers.bind(this), this.name);

    // Automated expiry check every 5 minutes
    cronManager.schedule('voucher-expiry-check', '*/5 * * * *', () => this.checkExpirations());

    logger.info(`${this.name} started (expiry interval: 5m)`);
  }

  async stop(): Promise<void> {
    cronManager.stop('voucher-expiry-check');
  }

  private async checkExpirations() {
    const db = getFirestore();
    const now = new Date();
    
    try {
      const snap = await db.collection('vouchers')
        .where('status', '==', 'ACTIVE')
        .where('validUntil', '<', now)
        .get();

      if (!snap.empty) {
        const batch = db.batch();
        snap.forEach(doc => {
          batch.update(doc.ref, { status: 'EXPIRED', expiredAt: now });
          eventBus.publish('voucher:expired', { code: doc.data().code }, this.name);
        });
        await batch.commit();
        logger.info(`VoucherAgent: Expired ${snap.size} active vouchers.`);
      }
    } catch (err: any) {
      logger.error(`VoucherAgent: Expiry check failed: ${err.message}`);
    }
  }

  private async generateVouchers(inputs: any) {
    const db = getFirestore();
    const batch = db.batch();
    const codes: string[] = [];

    const planSnap = await db.collection('plans').doc(inputs.plan_id).get();
    if (!planSnap.exists) throw new Error(`Plan ${inputs.plan_id} not found`);

    for (let i = 0; i < inputs.quantity; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const ref = db.collection('vouchers').doc(code);
      batch.set(ref, {
        code,
        planId: inputs.plan_id,
        status: 'QUEUED',
        createdAt: new Date()
      });
      codes.push(code);
    }

    await batch.commit();
    return { codes, planId: inputs.plan_id, status: 'queued' };
  }
}
