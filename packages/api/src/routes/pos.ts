import { Router, Response } from 'express';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { getFirestore, mcpRegistry, memoryManager } from '@agentclaw/kernel';

export const posRouter = Router();

// POST /api/pos/checkout
posRouter.post('/checkout', authMiddleware, requireRole('CASHIER', 'ADMIN', 'PARTNER'), async (req: AuthRequest, res: Response) => {
  try {
    const { planId, quantity, paymentMethod, walletId, counterId, notes } = req.body;
    if (!planId || !quantity || !paymentMethod) {
      return res.status(400).json({ success: false, error: 'planId, quantity, paymentMethod required' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid quantity' });
    }

    const db = getFirestore();
    const planDoc = await db.collection('plans').doc(planId).get();
    if (!planDoc.exists) return res.status(404).json({ success: false, error: 'Plan not found' });
    
    const plan = planDoc.data() as any;
    const totalAmount = (plan.price || 0) * qty;

    // Call MCP capability to generate vouchers
    const genRes = await mcpRegistry.invokeTool('generate_vouchers', { plan_id: planId, quantity: qty });
    if (!genRes.success) throw new Error(genRes.error);
    const codes = genRes.data.codes;

    // Call MCP capability to process payment
    const payRes = await mcpRegistry.invokeTool('process_payment', { amount: totalAmount, currency: 'USD', method: paymentMethod });
    if (!payRes.success) throw new Error(payRes.error);

    // Call MCP capability to print vouchers
    for (const code of codes) {
      mcpRegistry.invokeTool('print_voucher', { printer_ip: 'local', voucher_code: code })
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
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pos/sales-report — cashier sales report
posRouter.get('/sales-report', authMiddleware, requireRole('CASHIER', 'PARTNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('payments').where('status', '==', 'COMPLETED').get();
    let total = 0;
    const byMethod: any = {};
    
    snap.forEach(doc => {
      const p = doc.data();
      total += p.amount;
      byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
    });

    return res.json({ success: true, data: { total, byMethod } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pos/queue-length — voucher queue
posRouter.get('/queue-length', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const length = await memoryManager.getQueueLength();
    return res.json({ success: true, data: { length } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
