import { Router } from 'express';
import { channelsManager, logger } from '@agentclaw/kernel';

export const channelsRouter = Router();

// Get channels status
channelsRouter.get('/status', async (req, res) => {
  try {
    const status = await channelsManager.getStatus();
    return res.json({ success: true, data: status });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Configure channels
channelsRouter.post('/config', (req, res) => {
  try {
    channelsManager.updateConfig(req.body);
    return res.json({ success: true, data: { message: 'Channels configuration updated' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Send message via channel
channelsRouter.post('/send', async (req, res) => {
  const { channel, to, content, metadata } = req.body;
  if (!channel || !to || !content) {
    return res.status(400).json({ success: false, error: 'Missing required fields: channel, to, content' });
  }

  try {
    const success = await channelsManager.send({ channel, to, content, metadata });
    if (success) {
      return res.json({ success: true, data: { message: `Message sent via ${channel}` } });
    } else {
      return res.status(500).json({ success: false, error: `Failed to send message via ${channel}` });
    }
  } catch (err: any) {
    logger.error(`Channels API Error: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
});
