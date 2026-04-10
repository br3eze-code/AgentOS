"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifierAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class NotifierAgent {
    name = 'NotifierAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
            name: 'send_notification',
            description: 'Send a notification via Email, WhatsApp, or Push',
            inputSchema: {
                type: 'object',
                properties: {
                    target: { type: 'string' },
                    channel: { type: 'string', enum: ['EMAIL', 'WHATSAPP', 'PUSH'] },
                    message: { type: 'string' }
                },
                required: ['target', 'channel', 'message']
            }
        }, this.sendNotification.bind(this));
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async sendNotification(inputs) {
        const db = (0, kernel_1.getFirestore)();
        const ref = db.collection('notifications').doc();
        await ref.set({
            target: inputs.target,
            channel: inputs.channel,
            message: inputs.message,
            status: 'SENT',
            createdAt: new Date()
        });
        return { notificationId: ref.id, status: 'sent' };
    }
}
exports.NotifierAgent = NotifierAgent;
//# sourceMappingURL=NotifierAgent.js.map