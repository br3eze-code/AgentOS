"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelsRouter = void 0;
const express_1 = require("express");
const kernel_1 = require("@agentclaw/kernel");
exports.channelsRouter = (0, express_1.Router)();
// Get channels status
exports.channelsRouter.get('/status', async (req, res) => {
    try {
        const status = await kernel_1.channelsManager.getStatus();
        return res.json({ success: true, data: status });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// Configure channels
exports.channelsRouter.post('/config', (req, res) => {
    try {
        kernel_1.channelsManager.updateConfig(req.body);
        return res.json({ success: true, data: { message: 'Channels configuration updated' } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// Send message via channel
exports.channelsRouter.post('/send', async (req, res) => {
    const { channel, to, content, metadata } = req.body;
    if (!channel || !to || !content) {
        return res.status(400).json({ success: false, error: 'Missing required fields: channel, to, content' });
    }
    try {
        const success = await kernel_1.channelsManager.send({ channel, to, content, metadata });
        if (success) {
            return res.json({ success: true, data: { message: `Message sent via ${channel}` } });
        }
        else {
            return res.status(500).json({ success: false, error: `Failed to send message via ${channel}` });
        }
    }
    catch (err) {
        kernel_1.logger.error(`Channels API Error: ${err.message}`);
        return res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=channels.js.map