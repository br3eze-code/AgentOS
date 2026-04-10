"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotspotRouter = void 0;
const express_1 = require("express");
const kernel_1 = require("@agentclaw/kernel");
const auth_1 = require("../middleware/auth");
exports.hotspotRouter = (0, express_1.Router)();
// GET /api/hotspots — list all hotspots
exports.hotspotRouter.get('/', auth_1.authMiddleware, async (_req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('hotspots').orderBy('name', 'asc').get();
        const hotspots = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ success: true, data: hotspots });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/hotspots — add a hotspot (Deploy MCP capability)
exports.hotspotRouter.post('/', auth_1.authMiddleware, (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { name, routerIp, apiPort, apiUser, apiPassword, location, partnerId } = req.body;
        const mcpRes = await kernel_1.mcpRegistry.invokeTool('deploy_hotspot', {
            location: location || 'Unknown',
            partner_id: partnerId || 'system',
            router_ip: routerIp
        });
        if (!mcpRes.success)
            throw new Error(mcpRes.error);
        return res.status(201).json({ success: true, data: mcpRes.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/hotspots/:id/status — get status
exports.hotspotRouter.get('/:id/status', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('hotspots').doc(req.params.id).get();
        return res.json({ success: true, data: snap.exists ? snap.data() : { status: 'OFFLINE' } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/hotspots/roam — magic roaming MCP capability
exports.hotspotRouter.post('/roam', async (req, res) => {
    try {
        const { code, new_hotspot_id, macAddress } = req.body;
        if (!code || !new_hotspot_id || !macAddress) {
            return res.status(400).json({ success: false, error: 'code, new_hotspot_id, macAddress required' });
        }
        const result = await kernel_1.mcpRegistry.invokeTool('roam_session', {
            code,
            new_hotspot_id,
            mac_address: macAddress
        });
        if (!result.success)
            throw new Error(result.error);
        return res.json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/hotspots/:id/sessions — active sessions
exports.hotspotRouter.get('/:id/sessions', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('sessions')
            .where('hotspotId', '==', req.params.id)
            .where('status', '==', 'ACTIVE')
            .get();
        const sessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ success: true, data: sessions });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=hotspots.js.map