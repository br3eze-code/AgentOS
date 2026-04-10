import { logger } from './index';
import { z } from 'zod';

export interface ITool {
    name: string;
    description: string;
    inputSchema: z.ZodObject<any>;
    handler: (args: any) => Promise<any>;
}

export class ToolOrchestrator {
    private static instance: ToolOrchestrator;
    private tools: Map<string, ITool> = new Map();

    private constructor() {}

    async init() {
        logger.info('ToolOrchestrator: Initialized');
    }

    static getInstance(): ToolOrchestrator {
        if (!ToolOrchestrator.instance) {
            ToolOrchestrator.instance = new ToolOrchestrator();
        }
        return ToolOrchestrator.instance;
    }

    registerTool(tool: ITool) {
        if (this.tools.has(tool.name)) {
            logger.warn(`ToolOrchestrator: Overwriting tool '${tool.name}'`);
        }
        this.tools.set(tool.name, tool);
        logger.info(`ToolOrchestrator: Registered tool '${tool.name}'`);
    }

    getTool(name: string): ITool | undefined {
        return this.tools.get(name);
    }

    async execute(name: string, args: any): Promise<any> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`ToolOrchestrator: Tool '${name}' not found`);
        }

        try {
            // Validate input schema
            const validatedArgs = tool.inputSchema.parse(args);
            logger.info(`ToolOrchestrator: Executing '${name}' with args`, validatedArgs);
            return await tool.handler(validatedArgs);
        } catch (err: any) {
            logger.error(`ToolOrchestrator: Execution of '${name}' failed`, err);
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

export const toolOrchestrator = ToolOrchestrator.getInstance();
