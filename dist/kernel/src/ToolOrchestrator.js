"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolOrchestrator = exports.ToolOrchestrator = void 0;
const index_1 = require("./index");
class ToolOrchestrator {
    static instance;
    tools = new Map();
    constructor() { }
    async init() {
        index_1.logger.info('ToolOrchestrator: Initialized');
    }
    static getInstance() {
        if (!ToolOrchestrator.instance) {
            ToolOrchestrator.instance = new ToolOrchestrator();
        }
        return ToolOrchestrator.instance;
    }
    registerTool(tool) {
        if (this.tools.has(tool.name)) {
            index_1.logger.warn(`ToolOrchestrator: Overwriting tool '${tool.name}'`);
        }
        this.tools.set(tool.name, tool);
        index_1.logger.info(`ToolOrchestrator: Registered tool '${tool.name}'`);
    }
    getTool(name) {
        return this.tools.get(name);
    }
    async execute(name, args) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`ToolOrchestrator: Tool '${name}' not found`);
        }
        try {
            // Validate input schema
            const validatedArgs = tool.inputSchema.parse(args);
            index_1.logger.info(`ToolOrchestrator: Executing '${name}' with args`, validatedArgs);
            return await tool.handler(validatedArgs);
        }
        catch (err) {
            index_1.logger.error(`ToolOrchestrator: Execution of '${name}' failed`, err);
            throw err;
        }
    }
    getToolDefinitions() {
        return Array.from(this.tools.values()).map(t => ({
            name: t.name,
            description: t.description,
            // Simple string representation of schema for LLM
            parameters: t.inputSchema._def.shape()
        }));
    }
}
exports.ToolOrchestrator = ToolOrchestrator;
exports.toolOrchestrator = ToolOrchestrator.getInstance();
//# sourceMappingURL=ToolOrchestrator.js.map