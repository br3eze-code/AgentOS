import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';

export class NotifierAgent implements IAgent {
  readonly name = 'NotifierAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
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

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async sendNotification(inputs: any) {
    const db = getFirestore();
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
