import EventEmitter from 'events';
import { AgentEvent } from '@agentclaw/shared';
type EventHandler<T = unknown> = (event: AgentEvent<T>) => void | Promise<void>;
/**
 * AgentOS EventBus — typed publish/subscribe event bus
 * All agents communicate exclusively through this bus.
 */
export declare class EventBus extends EventEmitter {
    private static instance;
    private constructor();
    static getInstance(): EventBus;
    /**
     * Subscribe to an event type
     */
    on<T = unknown>(event: string, handler: EventHandler<T>): this;
    /**
     * Subscribe to an event type (once)
     */
    once<T = unknown>(event: string, handler: EventHandler<T>): this;
    /**
     * Publish an event to all subscribers
     */
    publish<T = unknown>(type: string, payload: T, source: string): void;
    /**
     * Remove a specific handler from an event
     */
    off<T = unknown>(event: string, handler: EventHandler<T>): this;
}
export declare const eventBus: EventBus;
export {};
//# sourceMappingURL=EventBus.d.ts.map