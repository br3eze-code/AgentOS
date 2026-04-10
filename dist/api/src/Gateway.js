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
exports.gateway = exports.Gateway = exports.ChannelRegistry = exports.WSChannel = void 0;
const kernel_1 = require("@agentclaw/kernel");
const ws = __importStar(require("ws"));
const uuid_1 = require("uuid");
class WSChannel {
    name;
    socket;
    gateway;
    constructor(name, socket, gateway) {
        this.name = name;
        this.socket = socket;
        this.gateway = gateway;
        this.socket.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                await this.gateway.handleIncomingMessage(this.name, message.from || 'unknown', message.text);
            }
            catch (err) {
                kernel_1.logger.error(`WSChannel [${this.name}]: Failed to parse incoming message`, err);
            }
        });
    }
    async sendMessage(to, message) {
        if (this.socket.readyState === ws.WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ to, text: message, timestamp: new Date().toISOString() }));
        }
    }
    onMessage(handler) {
        // Already handled in constructor for this implementation
    }
}
exports.WSChannel = WSChannel;
class ChannelRegistry {
    channels = new Map();
    register(channel) {
        this.channels.set(channel.name, channel);
        kernel_1.logger.info(`ChannelRegistry: Registered channel '${channel.name}'`);
    }
    unregister(name) {
        this.channels.delete(name);
        kernel_1.logger.info(`ChannelRegistry: Unregistered channel '${name}'`);
    }
    getChannel(name) {
        return this.channels.get(name);
    }
    getChannelNames() {
        return Array.from(this.channels.keys());
    }
}
exports.ChannelRegistry = ChannelRegistry;
class Gateway {
    static instance;
    channelRegistry;
    wss = null;
    port;
    constructor() {
        this.channelRegistry = new ChannelRegistry();
        this.port = (kernel_1.config.api.port || 4000) + 1; // Default to 4001 for control plane
    }
    getStats() {
        return {
            port: this.port,
            activeChannels: this.channelRegistry.getChannelNames().length,
            channels: this.channelRegistry.getChannelNames(),
            status: this.wss ? 'ONLINE' : 'OFFLINE'
        };
    }
    static getInstance() {
        if (!Gateway.instance) {
            Gateway.instance = new Gateway();
        }
        return Gateway.instance;
    }
    get registry() {
        return this.channelRegistry;
    }
    async start() {
        if (this.wss)
            return;
        this.wss = new ws.WebSocketServer({ port: this.port });
        kernel_1.logger.info(`Gateway: WebSocket Control Plane started on port ${this.port}`);
        // Listen to global ACPx events to stream to control plane
        kernel_1.eventBus.on('acpx:all', async (event) => {
            await this.broadcast(JSON.stringify({ type: 'acpx', ...event }));
        });
        this.wss.on('connection', (ws) => {
            const channelId = `ws-${(0, uuid_1.v4)().slice(0, 8)}`;
            const channel = new WSChannel(channelId, ws, this);
            this.channelRegistry.register(channel);
            ws.on('close', () => {
                this.channelRegistry.unregister(channelId);
            });
            ws.send(JSON.stringify({ type: 'welcome', channelId, message: 'Connected to OpenClaw Gateway' }));
        });
    }
    async broadcast(message) {
        kernel_1.logger.info(`Gateway: Broadcasting message to ${this.channelRegistry.getChannelNames().length} channels...`);
        for (const name of this.channelRegistry.getChannelNames()) {
            const channel = this.channelRegistry.getChannel(name);
            if (channel) {
                await channel.sendMessage('all', message);
            }
        }
    }
    async handleIncomingMessage(channelName, from, text) {
        kernel_1.logger.info(`Gateway: Received message from ${from} via ${channelName}: ${text}`);
        kernel_1.eventBus.publish('gateway:message-received', {
            channel: channelName,
            from,
            text,
            timestamp: new Date().toISOString()
        }, 'Gateway');
    }
}
exports.Gateway = Gateway;
exports.gateway = Gateway.getInstance();
//# sourceMappingURL=Gateway.js.map