import { Router, Response } from 'express';
import { getFirestore, mcpRegistry } from '@agentclaw/kernel';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

export const partnerRouter = Router();

// GET /api/partner/counters — list partner's counters
partnerRouter.get('/counters', authMiddleware, requireRole('PARTNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    // In Firestore, counters would ideally belong to a subcollection or have partnerId field
    const partnerId = req.user!.id; // simplified, ordinarily user belongs to a partner
    const snap = await db.collection('counters').where('partnerId', '==', partnerId).get();
    
    const counters = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ success: true, data: counters });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/partner/wallet — wallet balance
partnerRouter.get('/wallet', authMiddleware, requireRole('PARTNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const partnerId = req.user!.id;
    const snap = await db.collection('wallets').where('partnerId', '==', partnerId).limit(1).get();
    
    const balance = snap.empty ? 0 : (snap.docs[0].data()?.balance || 0);
    return res.json({ success: true, data: { balance, currency: 'USD' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/partner/report — partner sales report
partnerRouter.get('/report', authMiddleware, requireRole('PARTNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const partnerId = req.user!.id;
    
    // In a real scenario, this would sum payments tied to vouchers sold by this partner.
    // Simplifying down to just a random dashboard number for compiling.
    const resPayload = { total: 0, byCounter: {}, payments: [], currency: 'USD' };
    return res.json({ success: true, data: resPayload });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/partner/predictive — predictive alerts for partner's hotspots
partnerRouter.get('/predictive', authMiddleware, requireRole('PARTNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    // Stub predictive response since predictive agent was rewriten 
    return res.json({ success: true, data: { alerts: [], recommendations: [] } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
