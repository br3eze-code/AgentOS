import { logger } from './Logger';
import { eventBus } from './EventBus';
import { v4 as uuidv4 } from 'uuid';

export interface ACPMessage {
  type: 'state' | 'log' | 'tool_call' | 'tool_result' | 'asset' | 'error' | 'finish';
  streamId: string;
  agentId: string;
  data: any;
  timestamp: string;
}

/**
 * ACPx (Agent Context Protocol eXtensions)
 * Manages stateful stream execution for long-running agents.
 * Connects to the Gateway to stream events over WebSockets.
 */
export class ACPxManager {
  private static instance: ACPxManager;
  private activeStreams: Map<string, { agentId: string; startedAt: number }> = new Map();

  private constructor() {}

  static getInstance(): ACPxManager {
    if (!ACPxManager.instance) {
      ACPxManager.instance = new ACPxManager();
    }
    return ACPxManager.instance;
  }

  createStream(agentId: string): string {
    const streamId = uuidv4();
    this.activeStreams.set(streamId, { agentId, startedAt: Date.now() });
    logger.info(`ACPx: Created execution stream ${streamId} for agent ${agentId}`);
    return streamId;
  }

  endStream(streamId: string): void {
    if (this.activeStreams.has(streamId)) {
      this.emit(streamId, 'finish', { message: 'Stream closed gracefully' });
      this.activeStreams.delete(streamId);
      logger.info(`ACPx: Closed execution stream ${streamId}`);
    }
  }

  emit(streamId: string, type: ACPMessage['type'], data: any): void {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      logger.warn(`ACPx: Attempted to emit on invalid stream ${streamId}`);
      return;
    }

    const message: ACPMessage = {
      streamId,
      agentId: stream.agentId,
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    // Publish to the global event bus. The Gateway will listen to this and forward over WS.
    eventBus.publish(`acpx:stream:${streamId}`, message, 'ACPx');
    eventBus.publish(`acpx:all`, message, 'ACPx'); // Global tap for admin dashboard
  }

  getStreamStatus(streamId: string): any {
    const s = this.activeStreams.get(streamId);
    if (!s) return null;
    return {
      streamId,
      agentId: s.agentId,
      uptimeMs: Date.now() - s.startedAt,
    };
  }

  getActiveStreams(): any[] {
    return Array.from(this.activeStreams.entries()).map(([id, s]) => ({
      streamId: id,
      agentId: s.agentId,
      uptimeMs: Date.now() - s.startedAt,
    }));
  }
}

export const acpx = ACPxManager.getInstance();
