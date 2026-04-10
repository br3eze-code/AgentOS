export interface PromptContext {
    agentName: string;
    additionalContext?: string;
    tools?: string[];
}
export declare class PromptComposer {
    private static instance;
    private agentsDir;
    private constructor();
    static getInstance(): PromptComposer;
    composeSystemPrompt(context: PromptContext): Promise<string>;
    private loadMarkdown;
}
export declare const promptComposer: PromptComposer;
//# sourceMappingURL=PromptComposer.d.ts.map