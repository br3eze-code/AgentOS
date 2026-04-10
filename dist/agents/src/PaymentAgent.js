"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class PaymentAgent {
    name = 'PaymentAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
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
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async processPayment(inputs) {
        const db = (0, kernel_1.getFirestore)();
        const ref = db.collection('payments').doc();
        await ref.set({
            amount: inputs.amount,
            currency: inputs.currency || 'USD',
            method: inputs.method,
            reference: inputs.reference || '',
            status: 'COMPLETED',
            createdAt: new Date()
        });
        kernel_1.eventBus.publish('payment:completed', { paymentId: ref.id, amount: inputs.amount, method: inputs.method }, this.name);
        return { paymentId: ref.id, status: 'processed' };
    }
}
exports.PaymentAgent = PaymentAgent;
//# sourceMappingURL=PaymentAgent.js.map