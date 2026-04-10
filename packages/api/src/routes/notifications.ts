import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { mcpRegistry, getFirestore } from '@agentclaw/kernel';

export const notificationRouter = Router();

// GET /api/notifications — get user notifications
notificationRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('notifications')
      .where('target', '==', req.user!.id)
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();
      
    const notifications = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ success: true, data: notifications });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/send
notificationRouter.post('/send', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, channel, subject, message, to } = req.body;
    
    const mcpRes = await mcpRegistry.invokeTool('send_notification', {
      target: to || userId || req.user!.id,
      channel: channel || 'EMAIL',
      message: `${subject ? subject + '\\n' : ''}${message}`
    });
    
    if (!mcpRes.success) throw new Error(mcpRes.error);
    return res.json({ success: true, message: 'Notification sent' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
