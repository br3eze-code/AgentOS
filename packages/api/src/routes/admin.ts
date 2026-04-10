import { Router, Response } from 'express';
import { getFirestore, mcpRegistry } from '@agentclaw/kernel';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

export const adminRouter = Router();

// Middleware: admin-only
adminRouter.use(authMiddleware, requireRole('ADMIN'));

// GET /api/admin/dashboard
adminRouter.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    
    // Replace complex aggregations with simple counts for now
    const [usersSnap, vouchersSnap, paymentsSnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('vouchers').count().get(),
      db.collection('payments').where('status', '==', 'COMPLETED').get()
    ]);

    let totalRevenue = 0;
    paymentsSnap.forEach(doc => { totalRevenue += (doc.data().amount || 0); });

    return res.json({
      success: true,
      data: {
        totalUsers: usersSnap.data().count,
        totalVouchers: vouchersSnap.data().count,
        totalRevenue,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/users — list all users
adminRouter.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
    const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), passwordHash: undefined }));
    return res.json({ success: true, data: users });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/users — create user with any role
adminRouter.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const db = getFirestore();
    const ref = db.collection('users').doc();
    await ref.set({ name, email, passwordHash, phone, role, createdAt: new Date() });
    
    return res.status(201).json({
      success: true,
      data: { id: ref.id, name, email, role },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/users/:id
adminRouter.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    await db.collection('users').doc(req.params.id).delete();
    return res.json({ success: true, message: 'User deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/sessions — active sessions across all hotspots
adminRouter.get('/sessions', async (_req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('sessions').where('status', '==', 'ACTIVE').limit(100).get();
    const sessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ success: true, data: sessions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
