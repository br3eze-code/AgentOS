import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getFirestore, config } from '@agentclaw/kernel';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const db = getFirestore();
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as any;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as any
    );

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/register — admin only
authRouter.post('/register', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const db = getFirestore();
    
    const existing = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!existing.empty) return res.status(409).json({ success: false, error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const userRef = db.collection('users').doc();
    await userRef.set({ name, email, passwordHash, phone, role: role || 'USER', createdAt: new Date() });

    const token = jwt.sign({ id: userRef.id, role: role || 'USER', email }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as any);

    return res.status(201).json({
      success: true,
      data: { token, user: { id: userRef.id, name, email, role: role || 'USER' } },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
authRouter.get('/me', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'No token' });
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
    const db = getFirestore();
    const doc = await db.collection('users').doc(decoded.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'User not found' });
    
    const { name, email, role, phone } = doc.data() as any;
    return res.json({ success: true, data: { id: doc.id, name, email, role, phone } });
  } catch (err: any) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});
