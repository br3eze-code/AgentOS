export interface MCPServerConfig {
    command: string;
    args?: string[];
    env?: Record<string, string>;
}
export interface MCPToolManifest {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
}
/**
 * MCPorter — wraps an MCP (Model Context Protocol) server subprocess
 * as a typed TypeScript API, enabling native integration of any MCP-compatible
 * tool server without custom adapters.
 *
 * The server communicates over stdin/stdout using JSON-RPC 2.0.
 */
export declare class MCPorter {
    private process;
    private config;
    private pendingRequests;
    private requestCounter;
    private buffer;
    constructor(config: MCPServerConfig);
    /** Start the MCP server subprocess */
    spawn(): Promise<void>;
    private handleMessage;
    private send;
    /** List all tools provided by this MCP server */
    listTools(): Promise<MCPToolManifest[]>;
    /** Call a specific tool on the MCP server */
    call(toolName: string, args: Record<string, any>): Promise<any>;
    /** Terminate the server subprocess */
    terminate(): Promise<void>;
    get isRunning(): boolean;
}
//# sourceMappingURL=MCPorter.d.ts.map