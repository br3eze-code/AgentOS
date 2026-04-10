import EventEmitter from 'events';
import { AgentEvent } from '@agentclaw/shared';

type EventHandler<T = unknown> = (event: AgentEvent<T>) => void | Promise<void>;

/**
 * AgentOS EventBus — typed publish/subscribe event bus
 * All agents communicate exclusively through this bus.
 */
export class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event type
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): this {
    super.on(event, handler);
    return this;
  }

  /**
   * Subscribe to an event type (once)
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): this {
    super.once(event, handler);
    return this;
  }

  /**
   * Publish an event to all subscribers
   */
  publish<T = unknown>(type: string, payload: T, source: string): void {
    const event: AgentEvent<T> = {
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
  off<T = unknown>(event: string, handler: EventHandler<T>): this {
    super.off(event, handler);
    return this;
  }
}

export const eventBus = EventBus.getInstance();
