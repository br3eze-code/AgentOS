import { logger, eventBus, config } from '@agentclaw/kernel';
import * as ws from 'ws';
import { v4 as uuidv4 } from 'uuid';

export interface IChannel {
  name: string;
  sendMessage(to: string, message: string): Promise<void>;
  onMessage(handler: (from: string, text: string) => Promise<void>): void;
}

export class WSChannel implements IChannel {
  constructor(
    public name: string,
    private socket: ws.WebSocket,
    private gateway: Gateway
  ) {
    this.socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.gateway.handleIncomingMessage(this.name, message.from || 'unknown', message.text);
      } catch (err) {
        logger.error(`WSChannel [${this.name}]: Failed to parse incoming message`, err);
      }
    });
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (this.socket.readyState === ws.WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ to, text: message, timestamp: new Date().toISOString() }));
    }
  }

  onMessage(handler: (from: string, text: string) => Promise<void>): void {
    // Already handled in constructor for this implementation
  }
}

export class ChannelRegistry {
  private channels: Map<string, IChannel> = new Map();

  register(channel: IChannel) {
    this.channels.set(channel.name, channel);
    logger.info(`ChannelRegistry: Registered channel '${channel.name}'`);
  }

  unregister(name: string) {
    this.channels.delete(name);
    logger.info(`ChannelRegistry: Unregistered channel '${name}'`);
  }

  getChannel(name: string): IChannel | undefined {
    return this.channels.get(name);
  }

  getChannelNames(): string[] {
    return Array.from(this.channels.keys());
  }
}

export class Gateway {
  private static instance: Gateway;
  private channelRegistry: ChannelRegistry;
  private wss: ws.WebSocketServer | null = null;
  private port: number;

  private constructor() {
    this.channelRegistry = new ChannelRegistry();
    this.port = (config.api.port || 4000) + 1; // Default to 4001 for control plane
  }

  getStats() {
    return {
      port: this.port,
      activeChannels: this.channelRegistry.getChannelNames().length,
      channels: this.channelRegistry.getChannelNames(),
      status: this.wss ? 'ONLINE' : 'OFFLINE'
    };
  }

  static getInstance(): Gateway {
    if (!Gateway.instance) {
      Gateway.instance = new Gateway();
    }
    return Gateway.instance;
  }

  get registry() {
    return this.channelRegistry;
  }

  async start() {
    if (this.wss) return;

    this.wss = new ws.WebSocketServer({ port: this.port });
    logger.info(`Gateway: WebSocket Control Plane started on port ${this.port}`);

    // Listen to global ACPx events to stream to control plane
    eventBus.on('acpx:all', async (event: any) => {
      await this.broadcast(JSON.stringify({ type: 'acpx', ...event }));
    });

    this.wss.on('connection', (ws) => {
      const channelId = `ws-${uuidv4().slice(0, 8)}`;
      const channel = new WSChannel(channelId, ws, this);
      this.channelRegistry.register(channel);

      ws.on('close', () => {
        this.channelRegistry.unregister(channelId);
      });

      ws.send(JSON.stringify({ type: 'welcome', channelId, message: 'Connected to OpenClaw Gateway' }));
    });
  }

  async broadcast(message: string) {
    logger.info(`Gateway: Broadcasting message to ${this.channelRegistry.getChannelNames().length} channels...`);
    for (const name of this.channelRegistry.getChannelNames()) {
      const channel = this.channelRegistry.getChannel(name);
      if (channel) {
        await channel.sendMessage('all', message);
      }
    }
  }

  async handleIncomingMessage(channelName: string, from: string, text: string) {
    logger.info(`Gateway: Received message from ${from} via ${channelName}: ${text}`);
    eventBus.publish('gateway:message-received', { 
      channel: channelName, 
      from, 
      text,
      timestamp: new Date().toISOString()
    }, 'Gateway');
  }
}

export const gateway = Gateway.getInstance();
