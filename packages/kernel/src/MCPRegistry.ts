import { logger } from './Logger';
import { MCPToolDefinition, MCPToolResponse } from '@agentclaw/shared';

type ToolHandler = (inputs: Record<string, any>) => Promise<any>;

export class MCPRegistry {
  private static instance: MCPRegistry;
  private tools: Map<string, { definition: MCPToolDefinition; handler: ToolHandler; source: string }> = new Map();

  private constructor() {}

  static getInstance(): MCPRegistry {
    if (!MCPRegistry.instance) {
      MCPRegistry.instance = new MCPRegistry();
    }
    return MCPRegistry.instance;
  }

  registerTool(definition: MCPToolDefinition, handler: ToolHandler, source: string = 'unknown'): void {
    if (this.tools.has(definition.name)) {
      logger.warn(`MCPRegistry: Tool ${definition.name} is being overwritten by ${source}.`);
    }
    this.tools.set(definition.name, { definition, handler, source });
    logger.info(`MCPRegistry: Registered tool '${definition.name}' from ${source}`);
  }

  getToolDefinitions(): MCPToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  async invokeTool(name: string, inputs: Record<string, any>): Promise<MCPToolResponse> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `Tool ${name} not found.` };
    }

    try {
      // Basic validation based on required fields could go here
      const req = tool.definition.inputSchema.required || [];
      for (const field of req) {
        if (inputs[field] === undefined) {
          return { success: false, error: `Missing required input: ${field}` };
        }
      }

      const start = Date.now();
      const result = await tool.handler(inputs);
      const duration = Date.now() - start;
      
      logger.info(`MCPRegistry: Executed tool '${name}' from ${tool.source} in ${duration}ms`);
      return { success: true, data: result };
    } catch (err: any) {
      logger.error(`MCPRegistry: Error executing ${name} (source: ${tool.source}): ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}

export const mcpRegistry = MCPRegistry.getInstance();
