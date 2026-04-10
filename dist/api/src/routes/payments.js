"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const kernel_1 = require("@agentclaw/kernel");
exports.paymentRouter = (0, express_1.Router)();
// POST /api/payments/stripe
exports.paymentRouter.post('/stripe', async (req, res) => {
    try {
        const { voucherId, amount, currency, paymentMethodId, email } = req.body;
        // In a real integration, the PaymentAgent MCP tool would call Stripe API.
        const result = await kernel_1.mcpRegistry.invokeTool('process_payment', {
            amount, currency: currency || 'USD', method: 'STRIPE', reference: paymentMethodId
        });
        if (!result.success)
            throw new Error(result.error);
        return res.json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
});
// POST /api/payments/ecocash
exports.paymentRouter.post('/ecocash', async (req, res) => {
    try {
        const { voucherId, amount, phone } = req.body;
        const result = await kernel_1.mcpRegistry.invokeTool('process_payment', {
            amount, currency: 'USD', method: 'ECOCASH', reference: phone
        });
        if (!result.success)
            throw new Error(result.error);
        return res.json({ success: true, data: { paymentId: result.data.paymentId, status: 'pending' } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/payments/zipit
exports.paymentRouter.post('/zipit', async (req, res) => {
    try {
        const { voucherId, amount, accountNumber } = req.body;
        const result = await kernel_1.mcpRegistry.invokeTool('process_payment', {
            amount, currency: 'USD', method: 'ZIPIT', reference: accountNumber
        });
        if (!result.success)
            throw new Error(result.error);
        return res.json({ success: true, data: { paymentId: result.data.paymentId, status: 'pending' } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/payments/wallet/topup
exports.paymentRouter.post('/wallet/topup', auth_1.authMiddleware, (0, auth_1.requireRole)('ADMIN', 'PARTNER'), async (req, res) => {
    try {
        const { walletId, amount, method } = req.body;
        const db = (0, kernel_1.getFirestore)();
        await db.runTransaction(async (transaction) => {
            const walletRef = db.collection('wallets').doc(walletId);
            const snap = await transaction.get(walletRef);
            const currentBalance = snap.exists ? (snap.data()?.balance || 0) : 0;
            transaction.set(walletRef, { balance: currentBalance + amount, updatedAt: new Date() }, { merge: true });
        });
        return res.json({ success: true, message: `Wallet topped up by $${amount}` });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/payments/wallet/:id/balance
exports.paymentRouter.get('/wallet/:id/balance', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('wallets').doc(req.params.id).get();
        const balance = snap.exists ? (snap.data()?.balance || 0) : 0;
        return res.json({ success: true, data: { balance, currency: 'USD' } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=payments.js.map