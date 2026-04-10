"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plansRouter = void 0;
const express_1 = require("express");
const kernel_1 = require("@agentclaw/kernel");
const auth_1 = require("../middleware/auth");
exports.plansRouter = (0, express_1.Router)();
// GET /api/plans
exports.plansRouter.get('/', async (_req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('plans').where('active', '==', true).orderBy('priceRetail', 'asc').get();
        const plans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ success: true, data: plans });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/plans
exports.plansRouter.post('/', auth_1.authMiddleware, (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const planResult = await kernel_1.mcpRegistry.invokeTool('create_plan', {
            plan_name: req.body.name,
            price: req.body.priceRetail,
            duration_hours: req.body.durationHours,
            bandwidth_limit_kbps: req.body.speedLimitKbps || 0
        });
        if (!planResult.success)
            throw new Error(planResult.error);
        return res.status(201).json({ success: true, data: planResult.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// PUT /api/plans/:id
exports.plansRouter.put('/:id', auth_1.authMiddleware, (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        await db.collection('plans').doc(req.params.id).update(req.body);
        return res.json({ success: true, message: 'Plan updated' });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// DELETE /api/plans/:id
exports.plansRouter.delete('/:id', auth_1.authMiddleware, (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        await db.collection('plans').doc(req.params.id).update({ active: false });
        return res.json({ success: true, message: 'Plan deactivated' });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=plans.js.map