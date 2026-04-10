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
export declare class ACPxManager {
    private static instance;
    private activeStreams;
    private constructor();
    static getInstance(): ACPxManager;
    createStream(agentId: string): string;
    endStream(streamId: string): void;
    emit(streamId: string, type: ACPMessage['type'], data: any): void;
    getStreamStatus(streamId: string): any;
    getActiveStreams(): any[];
}
export declare const acpx: ACPxManager;
//# sourceMappingURL=ACPx.d.ts.map