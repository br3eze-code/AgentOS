import { logger } from './Logger';
import { eventBus } from './EventBus';

export interface ChannelConfig {
  whatsapp?: {
    enabled: boolean;
    phoneNumberId?: string;
    accessToken?: string;
  };
  email?: {
    enabled: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
  };
  push?: {
    enabled: boolean;
    fcmServerKey?: string;
  };
}

export interface SendMessageParams {
  channel: 'whatsapp' | 'email' | 'push';
  to: string;
  content: string;
  metadata?: Record<string, any>;
}

export class ChannelsManager {
  private static instance: ChannelsManager;
  private config: ChannelConfig = {
    whatsapp: { enabled: false },
    email: { enabled: false },
    push: { enabled: false },
  };

  private constructor() {}

  static getInstance(): ChannelsManager {
    if (!ChannelsManager.instance) {
      ChannelsManager.instance = new ChannelsManager();
    }
    return ChannelsManager.instance;
  }

  updateConfig(updates: Partial<ChannelConfig>): void {
    this.config = {
      whatsapp: { ...this.config.whatsapp, ...updates.whatsapp, enabled: updates.whatsapp?.enabled ?? this.config.whatsapp?.enabled ?? false},
      email: { ...this.config.email, ...updates.email, enabled: updates.email?.enabled ?? this.config.email?.enabled ?? false},
      push: { ...this.config.push, ...updates.push, enabled: updates.push?.enabled ?? this.config.push?.enabled ?? false},
    };
    logger.info('ChannelsManager: Configuration updated');
  }

  getConfig(): ChannelConfig {
    return this.config;
  }

  async send(params: SendMessageParams): Promise<boolean> {
    const { channel, to, content } = params;

    if (!this.config[channel]?.enabled) {
      logger.warn(`ChannelsManager: Attempted to send via disabled channel '${channel}'`);
      return false;
    }

    try {
      logger.info(`ChannelsManager: Delivering message to ${to} via ${channel}...`);
      
      // In a real implementation, this would use Baileys (WA), Nodemailer (Email), or firebase-admin (Push)
      // For OpenClaw parity, we stub the actual delivery until the specific vendor SDKs are wired in.
      
      // Emit an event that the CLI or Admin Dashboard can listen to
      eventBus.publish(`channels:sent`, { channel, to, content, timestamp: new Date().toISOString() }, 'Channels');

      return true;
    } catch (err: any) {
      logger.error(`ChannelsManager: Failed to send via ${channel}: ${err.message}`);
      return false;
    }
  }

  async getStatus() {
    return {
      whatsapp: { status: this.config.whatsapp?.enabled ? 'CONNECTED' : 'SETUP_NEEDED' },
      email: { status: this.config.email?.enabled ? 'CONNECTED' : 'SETUP_NEEDED' },
      push: { status: this.config.push?.enabled ? 'CONNECTED' : 'SETUP_NEEDED' },
    };
  }
}

export const channelsManager = ChannelsManager.getInstance();
