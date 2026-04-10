"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.EventBus = void 0;
const events_1 = __importDefault(require("events"));
/**
 * AgentOS EventBus — typed publish/subscribe event bus
 * All agents communicate exclusively through this bus.
 */
class EventBus extends events_1.default {
    static instance;
    constructor() {
        super();
        this.setMaxListeners(100);
    }
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    /**
     * Subscribe to an event type
     */
    on(event, handler) {
        super.on(event, handler);
        return this;
    }
    /**
     * Subscribe to an event type (once)
     */
    once(event, handler) {
        super.once(event, handler);
        return this;
    }
    /**
     * Publish an event to all subscribers
     */
    publish(type, payload, source) {
        const event = {
            type,
            payload,
            timestamp: new Date(),
            source,
        };
        this.emit(type, event);
        this.emit('*', event); // wildcard listener for logging/debugging
    }
    /**
     * Remove a specific handler from an event
     */
    off(event, handler) {
        super.off(event, handler);
        return this;
    }
}
exports.EventBus = EventBus;
exports.eventBus = EventBus.getInstance();
//# sourceMappingURL=EventBus.js.map