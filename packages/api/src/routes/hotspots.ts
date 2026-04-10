import { Router, Response } from 'express';
import { getFirestore, mcpRegistry } from '@agentclaw/kernel';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

export const hotspotRouter = Router();

// GET /api/hotspots — list all hotspots
hotspotRouter.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('hotspots').orderBy('name', 'asc').get();
    const hotspots = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ success: true, data: hotspots });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/hotspots — add a hotspot (Deploy MCP capability)
hotspotRouter.post('/', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, routerIp, apiPort, apiUser, apiPassword, location, partnerId } = req.body;
    const mcpRes = await mcpRegistry.invokeTool('deploy_hotspot', {
      location: location || 'Unknown',
      partner_id: partnerId || 'system',
      router_ip: routerIp
    });

    if (!mcpRes.success) throw new Error(mcpRes.error);
    return res.status(201).json({ success: true, data: mcpRes.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/hotspots/:id/status — get status
hotspotRouter.get('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('hotspots').doc(req.params.id).get();
    return res.json({ success: true, data: snap.exists ? snap.data() : { status: 'OFFLINE' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/hotspots/roam — magic roaming MCP capability
hotspotRouter.post('/roam', async (req: AuthRequest, res: Response) => {
  try {
    const { code, new_hotspot_id, macAddress } = req.body;
    if (!code || !new_hotspot_id || !macAddress) {
      return res.status(400).json({ success: false, error: 'code, new_hotspot_id, macAddress required' });
    }
    const result = await mcpRegistry.invokeTool('roam_session', { 
      code, 
      new_hotspot_id, 
      mac_address: macAddress 
    });
    if (!result.success) throw new Error(result.error);
    return res.json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/hotspots/:id/sessions — active sessions
hotspotRouter.get('/:id/sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('sessions')
      .where('hotspotId', '==', req.params.id)
      .where('status', '==', 'ACTIVE')
      .get();
      
    const sessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ success: true, data: sessions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
