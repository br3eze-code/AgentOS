"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const kernel_1 = require("@agentclaw/kernel");
exports.notificationRouter = (0, express_1.Router)();
// GET /api/notifications — get user notifications
exports.notificationRouter.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('notifications')
            .where('target', '==', req.user.id)
            .orderBy('createdAt', 'desc')
            .limit(30)
            .get();
        const notifications = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ success: true, data: notifications });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/notifications/send
exports.notificationRouter.post('/send', auth_1.authMiddleware, async (req, res) => {
    try {
        const { userId, channel, subject, message, to } = req.body;
        const mcpRes = await kernel_1.mcpRegistry.invokeTool('send_notification', {
            target: to || userId || req.user.id,
            channel: channel || 'EMAIL',
            message: `${subject ? subject + '\\n' : ''}${message}`
        });
        if (!mcpRes.success)
            throw new Error(mcpRes.error);
        return res.json({ success: true, message: 'Notification sent' });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=notifications.js.map