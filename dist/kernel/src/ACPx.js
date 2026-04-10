"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acpx = exports.ACPxManager = void 0;
const Logger_1 = require("./Logger");
const EventBus_1 = require("./EventBus");
const uuid_1 = require("uuid");
/**
 * ACPx (Agent Context Protocol eXtensions)
 * Manages stateful stream execution for long-running agents.
 * Connects to the Gateway to stream events over WebSockets.
 */
class ACPxManager {
    static instance;
    activeStreams = new Map();
    constructor() { }
    static getInstance() {
        if (!ACPxManager.instance) {
            ACPxManager.instance = new ACPxManager();
        }
        return ACPxManager.instance;
    }
    createStream(agentId) {
        const streamId = (0, uuid_1.v4)();
        this.activeStreams.set(streamId, { agentId, startedAt: Date.now() });
        Logger_1.logger.info(`ACPx: Created execution stream ${streamId} for agent ${agentId}`);
        return streamId;
    }
    endStream(streamId) {
        if (this.activeStreams.has(streamId)) {
            this.emit(streamId, 'finish', { message: 'Stream closed gracefully' });
            this.activeStreams.delete(streamId);
            Logger_1.logger.info(`ACPx: Closed execution stream ${streamId}`);
        }
    }
    emit(streamId, type, data) {
        const stream = this.activeStreams.get(streamId);
        if (!stream) {
            Logger_1.logger.warn(`ACPx: Attempted to emit on invalid stream ${streamId}`);
            return;
        }
        const message = {
            streamId,
            agentId: stream.agentId,
            type,
            data,
            timestamp: new Date().toISOString(),
        };
        // Publish to the global event bus. The Gateway will listen to this and forward over WS.
        EventBus_1.eventBus.publish(`acpx:stream:${streamId}`, message, 'ACPx');
        EventBus_1.eventBus.publish(`acpx:all`, message, 'ACPx'); // Global tap for admin dashboard
    }
    getStreamStatus(streamId) {
        const s = this.activeStreams.get(streamId);
        if (!s)
            return null;
        return {
            streamId,
            agentId: s.agentId,
            uptimeMs: Date.now() - s.startedAt,
        };
    }
    getActiveStreams() {
        return Array.from(this.activeStreams.entries()).map(([id, s]) => ({
            streamId: id,
            agentId: s.agentId,
            uptimeMs: Date.now() - s.startedAt,
        }));
    }
}
exports.ACPxManager = ACPxManager;
exports.acpx = ACPxManager.getInstance();
//# sourceMappingURL=ACPx.js.map