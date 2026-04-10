import { z } from 'zod';
export interface ITool {
    name: string;
    description: string;
    inputSchema: z.ZodObject<any>;
    handler: (args: any) => Promise<any>;
}
export declare class ToolOrchestrator {
    private static instance;
    private tools;
    private constructor();
    init(): Promise<void>;
    static getInstance(): ToolOrchestrator;
    registerTool(tool: ITool): void;
    getTool(name: string): ITool | undefined;
    execute(name: string, args: any): Promise<any>;
    getToolDefinitions(): {
        name: string;
        description: string;
        parameters: any;
    }[];
}
export declare const toolOrchestrator: ToolOrchestrator;
//# sourceMappingURL=ToolOrchestrator.d.ts.map