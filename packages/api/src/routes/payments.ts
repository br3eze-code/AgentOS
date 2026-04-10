import { Router, Response } from 'express';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { mcpRegistry, getFirestore, memoryManager } from '@agentclaw/kernel';

export const paymentRouter = Router();

// POST /api/payments/stripe
paymentRouter.post('/stripe', async (req: AuthRequest, res: Response) => {
  try {
    const { voucherId, amount, currency, paymentMethodId, email } = req.body;
    // In a real integration, the PaymentAgent MCP tool would call Stripe API.
    const result = await mcpRegistry.invokeTool('process_payment', {
      amount, currency: currency || 'USD', method: 'STRIPE', reference: paymentMethodId
    });
    if (!result.success) throw new Error(result.error);
    return res.json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/payments/ecocash
paymentRouter.post('/ecocash', async (req: AuthRequest, res: Response) => {
  try {
    const { voucherId, amount, phone } = req.body;
    const result = await mcpRegistry.invokeTool('process_payment', {
      amount, currency: 'USD', method: 'ECOCASH', reference: phone
    });
    if (!result.success) throw new Error(result.error);
    return res.json({ success: true, data: { paymentId: result.data.paymentId, status: 'pending' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payments/zipit
paymentRouter.post('/zipit', async (req: AuthRequest, res: Response) => {
  try {
    const { voucherId, amount, accountNumber } = req.body;
    const result = await mcpRegistry.invokeTool('process_payment', {
      amount, currency: 'USD', method: 'ZIPIT', reference: accountNumber
    });
    if (!result.success) throw new Error(result.error);
    return res.json({ success: true, data: { paymentId: result.data.paymentId, status: 'pending' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payments/wallet/topup
paymentRouter.post('/wallet/topup', authMiddleware, requireRole('ADMIN', 'PARTNER'), async (req: AuthRequest, res: Response) => {
  try {
    const { walletId, amount, method } = req.body;
    const db = getFirestore();
    
    await db.runTransaction(async (transaction) => {
      const walletRef = db.collection('wallets').doc(walletId);
      const snap = await transaction.get(walletRef);
      const currentBalance = snap.exists ? (snap.data()?.balance || 0) : 0;
      transaction.set(walletRef, { balance: currentBalance + amount, updatedAt: new Date() }, { merge: true });
    });
    
    return res.json({ success: true, message: `Wallet topped up by $${amount}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/payments/wallet/:id/balance
paymentRouter.get('/wallet/:id/balance', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('wallets').doc(req.params.id).get();
    const balance = snap.exists ? (snap.data()?.balance || 0) : 0;
    
    return res.json({ success: true, data: { balance, currency: 'USD' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
