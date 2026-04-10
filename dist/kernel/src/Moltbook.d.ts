/**
 * Moltbooks enable script-driven execution of MCP tools.
 * A Molt script can be executed step-by-step.
 */
export declare class MoltbookExecutor {
    /**
     * Evaluates a Moltbook script provided as a string.
     * This executes the string in an environment with the MCP Registry injected.
     */
    static executeScript(scriptContent: string, contextVars?: Record<string, any>): Promise<any>;
    static executeFile(filePath: string, contextVars?: Record<string, any>): Promise<any>;
}
//# sourceMappingURL=Moltbook.d.ts.map