"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelsManager = exports.ChannelsManager = void 0;
const Logger_1 = require("./Logger");
const EventBus_1 = require("./EventBus");
class ChannelsManager {
    static instance;
    config = {
        whatsapp: { enabled: false },
        email: { enabled: false },
        push: { enabled: false },
    };
    constructor() { }
    static getInstance() {
        if (!ChannelsManager.instance) {
            ChannelsManager.instance = new ChannelsManager();
        }
        return ChannelsManager.instance;
    }
    updateConfig(updates) {
        this.config = {
            whatsapp: { ...this.config.whatsapp, ...updates.whatsapp, enabled: updates.whatsapp?.enabled ?? this.config.whatsapp?.enabled ?? false },
            email: { ...this.config.email, ...updates.email, enabled: updates.email?.enabled ?? this.config.email?.enabled ?? false },
            push: { ...this.config.push, ...updates.push, enabled: updates.push?.enabled ?? this.config.push?.enabled ?? false },
        };
        Logger_1.logger.info('ChannelsManager: Configuration updated');
    }
    getConfig() {
        return this.config;
    }
    async send(params) {
        const { channel, to, content } = params;
        if (!this.config[channel]?.enabled) {
            Logger_1.logger.warn(`ChannelsManager: Attempted to send via disabled channel '${channel}'`);
            return false;
        }
        try {
            Logger_1.logger.info(`ChannelsManager: Delivering message to ${to} via ${channel}...`);
            // In a real implementation, this would use Baileys (WA), Nodemailer (Email), or firebase-admin (Push)
            // For OpenClaw parity, we stub the actual delivery until the specific vendor SDKs are wired in.
            // Emit an event that the CLI or Admin Dashboard can listen to
            EventBus_1.eventBus.publish(`channels:sent`, { channel, to, content, timestamp: new Date().toISOString() }, 'Channels');
            return true;
        }
        catch (err) {
            Logger_1.logger.error(`ChannelsManager: Failed to send via ${channel}: ${err.message}`);
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
exports.ChannelsManager = ChannelsManager;
exports.channelsManager = ChannelsManager.getInstance();
//# sourceMappingURL=ChannelsManager.js.map