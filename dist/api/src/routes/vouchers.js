"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voucherRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const kernel_1 = require("@agentclaw/kernel");
exports.voucherRouter = (0, express_1.Router)();
// GET /api/vouchers — list vouchers
exports.voucherRouter.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const { status, planId, page = '1', pageSize = '20' } = req.query;
        let query = db.collection('vouchers');
        if (status)
            query = query.where('status', '==', status);
        if (planId)
            query = query.where('planId', '==', planId);
        // Simplistic pagination wrapper for Firestore
        const p = parseInt(page);
        const limit = parseInt(pageSize);
        // Note: real offset pagination in Firestore requires cursors, this is a mock proxy.
        const snap = await query.limit(limit).get();
        const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.json({ success: true, data: { items, count: items.length } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/vouchers/generate — generate batch of vouchers
exports.voucherRouter.post('/generate', auth_1.authMiddleware, (0, auth_1.requireRole)('ADMIN', 'PARTNER', 'CASHIER'), async (req, res) => {
    try {
        const { planId, quantity, maxUsage, prefix, length } = req.body;
        if (!planId || !quantity) {
            return res.status(400).json({ success: false, error: 'planId and quantity required' });
        }
        const mcpRes = await kernel_1.mcpRegistry.invokeTool('generate_vouchers', {
            plan_id: planId,
            quantity: parseInt(quantity)
        });
        if (!mcpRes.success)
            throw new Error(mcpRes.error);
        return res.status(201).json({ success: true, data: { codes: mcpRes.data.codes, count: mcpRes.data.codes.length } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/vouchers/activate — activate a voucher
exports.voucherRouter.post('/activate', async (req, res) => {
    try {
        const { code, macAddress, hotspotId, ipAddress } = req.body;
        if (!code || !macAddress || !hotspotId) {
            return res.status(400).json({ success: false, error: 'code, macAddress, hotspotId required' });
        }
        const mcpRes = await kernel_1.mcpRegistry.invokeTool('captive_portal_login', {
            voucher_code: code,
            mac_address: macAddress,
            hotspot_id: hotspotId,
            ip_address: ipAddress || '0.0.0.0'
        });
        if (!mcpRes.success)
            throw new Error(mcpRes.error);
        return res.json({ success: true, data: mcpRes.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/vouchers/:code/validate — validate (used for magic roaming PHP endpoint)
exports.voucherRouter.get('/:code/validate', async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('vouchers').where('code', '==', req.params.code).limit(1).get();
        if (snap.empty)
            return res.json({ success: false, error: 'Not found' });
        const v = snap.docs[0].data();
        return res.json({ success: true, data: { valid: v.status === 'ACTIVE' || v.status === 'NEW', voucher: v } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// DELETE /api/vouchers/:id — cancel a voucher
exports.voucherRouter.delete('/:id', auth_1.authMiddleware, (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        // Simplified cancelation logic
        await db.collection('vouchers').doc(req.params.id).update({ status: 'EXPIRED' });
        return res.json({ success: true, message: 'Voucher cancelled' });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/vouchers/reprint — reprint a voucher
exports.voucherRouter.post('/reprint', auth_1.authMiddleware, (0, auth_1.requireRole)('ADMIN', 'CASHIER'), async (req, res) => {
    try {
        const { code } = req.body;
        await kernel_1.mcpRegistry.invokeTool('print_voucher', { printer_ip: 'local', voucher_code: code });
        return res.json({ success: true, message: 'Print job queued' });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=vouchers.js.map