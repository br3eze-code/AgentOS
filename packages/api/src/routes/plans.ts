import { Router, Response } from 'express';
import { getFirestore, mcpRegistry } from '@agentclaw/kernel';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

export const plansRouter = Router();

// GET /api/plans
plansRouter.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('plans').where('active', '==', true).orderBy('priceRetail', 'asc').get();
    const plans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ success: true, data: plans });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/plans
plansRouter.post('/', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const planResult = await mcpRegistry.invokeTool('create_plan', {
      plan_name: req.body.name,
      price: req.body.priceRetail,
      duration_hours: req.body.durationHours,
      bandwidth_limit_kbps: req.body.speedLimitKbps || 0
    });
    
    if (!planResult.success) throw new Error(planResult.error);
    return res.status(201).json({ success: true, data: planResult.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/plans/:id
plansRouter.put('/:id', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    await db.collection('plans').doc(req.params.id).update(req.body);
    return res.json({ success: true, message: 'Plan updated' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/plans/:id
plansRouter.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    await db.collection('plans').doc(req.params.id).update({ active: false });
    return res.json({ success: true, message: 'Plan deactivated' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
