"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.posRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const kernel_1 = require("@agentclaw/kernel");
exports.posRouter = (0, express_1.Router)();
// POST /api/pos/checkout
exports.posRouter.post('/checkout', auth_1.authMiddleware, (0, auth_1.requireRole)('CASHIER', 'ADMIN', 'PARTNER'), async (req, res) => {
    try {
        const { planId, quantity, paymentMethod, walletId, counterId, notes } = req.body;
        if (!planId || !quantity || !paymentMethod) {
            return res.status(400).json({ success: false, error: 'planId, quantity, paymentMethod required' });
        }
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid quantity' });
        }
        const db = (0, kernel_1.getFirestore)();
        const planDoc = await db.collection('plans').doc(planId).get();
        if (!planDoc.exists)
            return res.status(404).json({ success: false, error: 'Plan not found' });
        const plan = planDoc.data();
        const totalAmount = (plan.price || 0) * qty;
        // Call MCP capability to generate vouchers
        const genRes = await kernel_1.mcpRegistry.invokeTool('generate_vouchers', { plan_id: planId, quantity: qty });
        if (!genRes.success)
            throw new Error(genRes.error);
        const codes = genRes.data.codes;
        // Call MCP capability to process payment
        const payRes = await kernel_1.mcpRegistry.invokeTool('process_payment', { amount: totalAmount, currency: 'USD', method: paymentMethod });
        if (!payRes.success)
            throw new Error(payRes.error);
        // Call MCP capability to print vouchers
        for (const code of codes) {
            kernel_1.mcpRegistry.invokeTool('print_voucher', { printer_ip: 'local', voucher_code: code })
                .catch((err) => {
                console.error(`Failed to print voucher ${code}:`, err);
            });
        }
        return res.status(201).json({
            success: true,
            data: {
                codes,
                voucherCount: codes.length,
                totalAmount,
                paymentIds: [payRes.data.paymentId],
                plan: { name: plan.name, durationHours: plan.durationHours },
                printQueued: true,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/pos/sales-report — cashier sales report
exports.posRouter.get('/sales-report', auth_1.authMiddleware, (0, auth_1.requireRole)('CASHIER', 'PARTNER', 'ADMIN'), async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('payments').where('status', '==', 'COMPLETED').get();
        let total = 0;
        const byMethod = {};
        snap.forEach(doc => {
            const p = doc.data();
            total += p.amount;
            byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
        });
        return res.json({ success: true, data: { total, byMethod } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/pos/queue-length — voucher queue
exports.posRouter.get('/queue-length', auth_1.authMiddleware, async (_req, res) => {
    try {
        const length = await kernel_1.memoryManager.getQueueLength();
        return res.json({ success: true, data: { length } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=pos.js.map