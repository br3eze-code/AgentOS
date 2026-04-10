import { MCPToolDefinition, MCPToolResponse } from '@agentclaw/shared';
type ToolHandler = (inputs: Record<string, any>) => Promise<any>;
export declare class MCPRegistry {
    private static instance;
    private tools;
    private constructor();
    static getInstance(): MCPRegistry;
    registerTool(definition: MCPToolDefinition, handler: ToolHandler, source?: string): void;
    getToolDefinitions(): MCPToolDefinition[];
    invokeTool(name: string, inputs: Record<string, any>): Promise<MCPToolResponse>;
}
export declare const mcpRegistry: MCPRegistry;
export {};
//# sourceMappingURL=MCPRegistry.d.ts.map