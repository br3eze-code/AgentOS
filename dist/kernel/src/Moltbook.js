"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoltbookExecutor = void 0;
const fs = __importStar(require("fs"));
const Logger_1 = require("./Logger");
const MCPRegistry_1 = require("./MCPRegistry");
/**
 * Moltbooks enable script-driven execution of MCP tools.
 * A Molt script can be executed step-by-step.
 */
class MoltbookExecutor {
    /**
     * Evaluates a Moltbook script provided as a string.
     * This executes the string in an environment with the MCP Registry injected.
     */
    static async executeScript(scriptContent, contextVars = {}) {
        Logger_1.logger.info('MoltbookExecutor: Executing script...');
        try {
            // Create a sandbox execution environment for the script
            // In a production environment, use `vm` module or generic secure sandbox.
            // Here we use an async Function to inject `mcpRegistry` and `logger`.
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            const executable = new AsyncFunction('mcpRegistry', 'logger', 'context', `
          try {
            ${scriptContent}
          } catch(e) {
            throw e;
          }
        `);
            const result = await executable(MCPRegistry_1.mcpRegistry, Logger_1.logger, contextVars);
            Logger_1.logger.info('MoltbookExecutor: Execution complete.');
            return result;
        }
        catch (err) {
            Logger_1.logger.error(`MoltbookExecutor: Execution failed: ${err.message}`);
            throw err;
        }
    }
    static async executeFile(filePath, contextVars = {}) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const scriptContent = fs.readFileSync(filePath, 'utf8');
        return this.executeScript(scriptContent, contextVars);
    }
}
exports.MoltbookExecutor = MoltbookExecutor;
//# sourceMappingURL=Moltbook.js.map