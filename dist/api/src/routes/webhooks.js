"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksRouter = void 0;
const express_1 = require("express");
const kernel_1 = require("@agentclaw/kernel");
exports.webhooksRouter = (0, express_1.Router)();
// POST /api/webhooks/stripe
exports.webhooksRouter.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig)
        return res.status(400).json({ error: 'Missing signature' });
    try {
        // Stripe requires raw body - in production use bodyParser.raw()
        const { default: Stripe } = await Promise.resolve().then(() => __importStar(require('stripe')));
        const stripe = new Stripe(kernel_1.config.stripe.secretKey, { apiVersion: '2024-06-20' });
        const event = stripe.webhooks.constructEvent(req.body, sig, kernel_1.config.stripe.webhookSecret);
        kernel_1.logger.info(`Stripe webhook: ${event.type}`);
        if (event.type === 'payment_intent.succeeded') {
            const pi = event.data.object;
            const voucherId = pi.metadata?.voucherId;
            if (voucherId) {
                kernel_1.logger.info(`Stripe payment succeeded for voucher ${voucherId}`);
            }
        }
        return res.json({ received: true });
    }
    catch (err) {
        kernel_1.logger.error(`Stripe webhook error: ${err.message}`);
        return res.status(400).json({ error: err.message });
    }
});
// GET /api/webhooks/whatsapp — verification
exports.webhooksRouter.get('/whatsapp', (req, res) => {
    // Simplistic placeholder for verification
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === kernel_1.config.whatsapp?.verifyToken) {
        return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
});
// POST /api/webhooks/whatsapp — incoming messages
exports.webhooksRouter.post('/whatsapp', (req, res) => {
    kernel_1.logger.info('WhatsApp webhook received', { body: JSON.stringify(req.body).slice(0, 200) });
    // Handle incoming WhatsApp messages via ChatOpsAgent MCP tool ideally
    res.sendStatus(200);
});
//# sourceMappingURL=webhooks.js.map