import { Router, Request, Response } from 'express';
import { config, logger } from '@agentclaw/kernel';
import crypto from 'crypto';

export const webhooksRouter = Router();

// POST /api/webhooks/stripe
webhooksRouter.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing signature' });

  try {
    // Stripe requires raw body - in production use bodyParser.raw()
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2024-06-20' as any });
    const event = stripe.webhooks.constructEvent(req.body, sig as string, config.stripe.webhookSecret);

    logger.info(`Stripe webhook: ${event.type}`);

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as any;
      const voucherId = pi.metadata?.voucherId;
      if (voucherId) {
        logger.info(`Stripe payment succeeded for voucher ${voucherId}`);
      }
    }

    return res.json({ received: true });
  } catch (err: any) {
    logger.error(`Stripe webhook error: ${err.message}`);
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/webhooks/whatsapp — verification
webhooksRouter.get('/whatsapp', (req: Request, res: Response) => {
  // Simplistic placeholder for verification
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;
  
  if (mode === 'subscribe' && token === config.whatsapp?.verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden');
});

// POST /api/webhooks/whatsapp — incoming messages
webhooksRouter.post('/whatsapp', (req: Request, res: Response) => {
  logger.info('WhatsApp webhook received', { body: JSON.stringify(req.body).slice(0, 200) });
  // Handle incoming WhatsApp messages via ChatOpsAgent MCP tool ideally
  res.sendStatus(200);
});
