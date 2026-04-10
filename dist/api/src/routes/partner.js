"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partnerRouter = void 0;
const express_1 = require("express");
const kernel_1 = require("@agentclaw/kernel");
const auth_1 = require("../middleware/auth");
exports.partnerRouter = (0, express_1.Router)();
// GET /api/partner/counters — list partner's counters
exports.partnerRouter.get('/counters', auth_1.authMiddleware, (0, auth_1.requireRole)('PARTNER', 'ADMIN'), async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        // In Firestore, counters would ideally belong to a subcollection or have partnerId field
        const partnerId = req.user.id; // simplified, ordinarily user belongs to a partner
        const snap = await db.collection('counters').where('partnerId', '==', partnerId).get();
        const counters = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ success: true, data: counters });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/partner/wallet — wallet balance
exports.partnerRouter.get('/wallet', auth_1.authMiddleware, (0, auth_1.requireRole)('PARTNER', 'ADMIN'), async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const partnerId = req.user.id;
        const snap = await db.collection('wallets').where('partnerId', '==', partnerId).limit(1).get();
        const balance = snap.empty ? 0 : (snap.docs[0].data()?.balance || 0);
        return res.json({ success: true, data: { balance, currency: 'USD' } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/partner/report — partner sales report
exports.partnerRouter.get('/report', auth_1.authMiddleware, (0, auth_1.requireRole)('PARTNER', 'ADMIN'), async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const partnerId = req.user.id;
        // In a real scenario, this would sum payments tied to vouchers sold by this partner.
        // Simplifying down to just a random dashboard number for compiling.
        const resPayload = { total: 0, byCounter: {}, payments: [], currency: 'USD' };
        return res.json({ success: true, data: resPayload });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/partner/predictive — predictive alerts for partner's hotspots
exports.partnerRouter.get('/predictive', auth_1.authMiddleware, (0, auth_1.requireRole)('PARTNER', 'ADMIN'), async (req, res) => {
    try {
        // Stub predictive response since predictive agent was rewriten 
        return res.json({ success: true, data: { alerts: [], recommendations: [] } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=partner.js.map