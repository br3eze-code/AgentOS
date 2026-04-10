import * as fs from 'fs';
import * as path from 'path';
import { logger } from './Logger';
import { mcpRegistry } from './MCPRegistry';

/**
 * Moltbooks enable script-driven execution of MCP tools.
 * A Molt script can be executed step-by-step.
 */
export class MoltbookExecutor {
  
  /**
   * Evaluates a Moltbook script provided as a string.
   * This executes the string in an environment with the MCP Registry injected.
   */
  static async executeScript(scriptContent: string, contextVars: Record<string, any> = {}): Promise<any> {
    logger.info('MoltbookExecutor: Executing script...');
    try {
      // Create a sandbox execution environment for the script
      // In a production environment, use `vm` module or generic secure sandbox.
      // Here we use an async Function to inject `mcpRegistry` and `logger`.
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      
      const executable = new AsyncFunction(
        'mcpRegistry', 
        'logger', 
        'context', 
        `
          try {
            ${scriptContent}
          } catch(e) {
            throw e;
          }
        `
      );

      const result = await executable(mcpRegistry, logger, contextVars);
      logger.info('MoltbookExecutor: Execution complete.');
      return result;

    } catch (err: any) {
      logger.error(`MoltbookExecutor: Execution failed: ${err.message}`);
      throw err;
    }
  }

  static async executeFile(filePath: string, contextVars: Record<string, any> = {}): Promise<any> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const scriptContent = fs.readFileSync(filePath, 'utf8');
    return this.executeScript(scriptContent, contextVars);
  }
}
