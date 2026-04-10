"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const kernel_1 = require("@agentclaw/kernel");
const auth_1 = require("../middleware/auth");
exports.authRouter = (0, express_1.Router)();
// POST /api/auth/login
exports.authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required' });
        }
        const db = (0, kernel_1.getFirestore)();
        const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        if (snapshot.empty)
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        const userDoc = snapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() };
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid)
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, email: user.email }, kernel_1.config.jwt.secret, { expiresIn: kernel_1.config.jwt.expiresIn });
        return res.json({
            success: true,
            data: {
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/auth/register — admin only
exports.authRouter.post('/register', auth_1.authMiddleware, (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        const db = (0, kernel_1.getFirestore)();
        const existing = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!existing.empty)
            return res.status(409).json({ success: false, error: 'Email already registered' });
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const userRef = db.collection('users').doc();
        await userRef.set({ name, email, passwordHash, phone, role: role || 'USER', createdAt: new Date() });
        const token = jsonwebtoken_1.default.sign({ id: userRef.id, role: role || 'USER', email }, kernel_1.config.jwt.secret, {
            expiresIn: kernel_1.config.jwt.expiresIn,
        });
        return res.status(201).json({
            success: true,
            data: { token, user: { id: userRef.id, name, email, role: role || 'USER' } },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/auth/me
exports.authRouter.get('/me', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token)
        return res.status(401).json({ success: false, error: 'No token' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, kernel_1.config.jwt.secret);
        const db = (0, kernel_1.getFirestore)();
        const doc = await db.collection('users').doc(decoded.id).get();
        if (!doc.exists)
            return res.status(404).json({ success: false, error: 'User not found' });
        const { name, email, role, phone } = doc.data();
        return res.json({ success: true, data: { id: doc.id, name, email, role, phone } });
    }
    catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
});
//# sourceMappingURL=auth.js.map