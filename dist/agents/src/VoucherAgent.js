"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoucherAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
const crypto_1 = __importDefault(require("crypto"));
class VoucherAgent {
    name = 'VoucherAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
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
        kernel_1.cronManager.schedule('voucher-expiry-check', '*/5 * * * *', () => this.checkExpirations());
        kernel_1.logger.info(`${this.name} started (expiry interval: 5m)`);
    }
    async stop() {
        kernel_1.cronManager.stop('voucher-expiry-check');
    }
    async checkExpirations() {
        const db = (0, kernel_1.getFirestore)();
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
                    kernel_1.eventBus.publish('voucher:expired', { code: doc.data().code }, this.name);
                });
                await batch.commit();
                kernel_1.logger.info(`VoucherAgent: Expired ${snap.size} active vouchers.`);
            }
        }
        catch (err) {
            kernel_1.logger.error(`VoucherAgent: Expiry check failed: ${err.message}`);
        }
    }
    async generateVouchers(inputs) {
        const db = (0, kernel_1.getFirestore)();
        const batch = db.batch();
        const codes = [];
        const planSnap = await db.collection('plans').doc(inputs.plan_id).get();
        if (!planSnap.exists)
            throw new Error(`Plan ${inputs.plan_id} not found`);
        for (let i = 0; i < inputs.quantity; i++) {
            const code = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
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
exports.VoucherAgent = VoucherAgent;
//# sourceMappingURL=VoucherAgent.js.map