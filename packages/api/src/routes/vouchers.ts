import { Router, Response } from 'express';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { mcpRegistry, getFirestore } from '@agentclaw/kernel';

export const voucherRouter = Router();

// GET /api/vouchers — list vouchers
voucherRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { status, planId, page = '1', pageSize = '20' } = req.query as Record<string, string>;
    
    let query: any = db.collection('vouchers');
    if (status) query = query.where('status', '==', status);
    if (planId) query = query.where('planId', '==', planId);
    
    // Simplistic pagination wrapper for Firestore
    const p = parseInt(page);
    const limit = parseInt(pageSize);
    // Note: real offset pagination in Firestore requires cursors, this is a mock proxy.
    const snap = await query.limit(limit).get();
    
    const items = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return res.json({ success: true, data: { items, count: items.length } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/vouchers/generate — generate batch of vouchers
voucherRouter.post('/generate', authMiddleware, requireRole('ADMIN', 'PARTNER', 'CASHIER'), async (req: AuthRequest, res: Response) => {
  try {
    const { planId, quantity, maxUsage, prefix, length } = req.body;
    if (!planId || !quantity) {
      return res.status(400).json({ success: false, error: 'planId and quantity required' });
    }
    
    const mcpRes = await mcpRegistry.invokeTool('generate_vouchers', {
      plan_id: planId,
      quantity: parseInt(quantity)
    });
    if (!mcpRes.success) throw new Error(mcpRes.error);
    
    return res.status(201).json({ success: true, data: { codes: mcpRes.data.codes, count: mcpRes.data.codes.length } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/vouchers/activate — activate a voucher
voucherRouter.post('/activate', async (req: AuthRequest, res: Response) => {
  try {
    const { code, macAddress, hotspotId, ipAddress } = req.body;
    if (!code || !macAddress || !hotspotId) {
      return res.status(400).json({ success: false, error: 'code, macAddress, hotspotId required' });
    }
    
    const mcpRes = await mcpRegistry.invokeTool('captive_portal_login', {
      voucher_code: code,
      mac_address: macAddress,
      hotspot_id: hotspotId,
      ip_address: ipAddress || '0.0.0.0'
    });
    if (!mcpRes.success) throw new Error(mcpRes.error);
    
    return res.json({ success: true, data: mcpRes.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/vouchers/:code/validate — validate (used for magic roaming PHP endpoint)
voucherRouter.get('/:code/validate', async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('vouchers').where('code', '==', req.params.code).limit(1).get();
    
    if (snap.empty) return res.json({ success: false, error: 'Not found' });
    const v = snap.docs[0].data();
    
    return res.json({ success: true, data: { valid: v.status === 'ACTIVE' || v.status === 'NEW', voucher: v } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/vouchers/:id — cancel a voucher
voucherRouter.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    // Simplified cancelation logic
    await db.collection('vouchers').doc(req.params.id).update({ status: 'EXPIRED' });
    return res.json({ success: true, message: 'Voucher cancelled' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/vouchers/reprint — reprint a voucher
voucherRouter.post('/reprint', authMiddleware, requireRole('ADMIN', 'CASHIER'), async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    await mcpRegistry.invokeTool('print_voucher', { printer_ip: 'local', voucher_code: code });
    return res.json({ success: true, message: 'Print job queued' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
