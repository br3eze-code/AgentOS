"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpRegistry = exports.MCPRegistry = void 0;
const Logger_1 = require("./Logger");
class MCPRegistry {
    static instance;
    tools = new Map();
    constructor() { }
    static getInstance() {
        if (!MCPRegistry.instance) {
            MCPRegistry.instance = new MCPRegistry();
        }
        return MCPRegistry.instance;
    }
    registerTool(definition, handler, source = 'unknown') {
        if (this.tools.has(definition.name)) {
            Logger_1.logger.warn(`MCPRegistry: Tool ${definition.name} is being overwritten by ${source}.`);
        }
        this.tools.set(definition.name, { definition, handler, source });
        Logger_1.logger.info(`MCPRegistry: Registered tool '${definition.name}' from ${source}`);
    }
    getToolDefinitions() {
        return Array.from(this.tools.values()).map(t => t.definition);
    }
    async invokeTool(name, inputs) {
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
            Logger_1.logger.info(`MCPRegistry: Executed tool '${name}' from ${tool.source} in ${duration}ms`);
            return { success: true, data: result };
        }
        catch (err) {
            Logger_1.logger.error(`MCPRegistry: Error executing ${name} (source: ${tool.source}): ${err.message}`);
            return { success: false, error: err.message };
        }
    }
}
exports.MCPRegistry = MCPRegistry;
exports.mcpRegistry = MCPRegistry.getInstance();
//# sourceMappingURL=MCPRegistry.js.map