"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const kernel_1 = require("@agentclaw/kernel");
const auth_1 = require("../middleware/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.adminRouter = (0, express_1.Router)();
// Middleware: admin-only
exports.adminRouter.use(auth_1.authMiddleware, (0, auth_1.requireRole)('ADMIN'));
// GET /api/admin/dashboard
exports.adminRouter.get('/dashboard', async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
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
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/admin/users — list all users
exports.adminRouter.get('/users', async (_req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
        const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), passwordHash: undefined }));
        return res.json({ success: true, data: users });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/admin/users — create user with any role
exports.adminRouter.post('/users', async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const db = (0, kernel_1.getFirestore)();
        const ref = db.collection('users').doc();
        await ref.set({ name, email, passwordHash, phone, role, createdAt: new Date() });
        return res.status(201).json({
            success: true,
            data: { id: ref.id, name, email, role },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// DELETE /api/admin/users/:id
exports.adminRouter.delete('/users/:id', async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        await db.collection('users').doc(req.params.id).delete();
        return res.json({ success: true, message: 'User deleted' });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/admin/sessions — active sessions across all hotspots
exports.adminRouter.get('/sessions', async (_req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('sessions').where('status', '==', 'ACTIVE').limit(100).get();
        const sessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ success: true, data: sessions });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=admin.js.map