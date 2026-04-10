"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
const BaseAgent_1 = require("./BaseAgent");
const child_process_1 = require("child_process");
const util_1 = require("util");
const zod_1 = require("zod");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class CLIAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super('cli-agent', 'CLI Agent', 'High-privileged tool bridge for system operations');
    }
    async start() {
        this.log('Starting CLI Agent...');
        // Register tools with the orchestrator
        kernel_1.toolOrchestrator.registerTool({
            name: 'execute_command',
            description: 'Execute a system CLI command',
            inputSchema: zod_1.z.object({
                command: zod_1.z.string().describe('The command to execute'),
                bg: zod_1.z.boolean().optional().describe('Whether to run in background')
            }),
            handler: async (args) => this.executeCommand(args)
        });
        this.status = 'IDLE';
    }
    async stop() {
        this.log('Stopping CLI Agent...');
    }
    async executeCommand(inputs) {
        const { command, bg } = inputs;
        this.log(`Executing command: ${command}`);
        try {
            if (bg) {
                (0, child_process_1.exec)(command); // Flame and forget
                return { success: true, status: 'spawned' };
            }
            const { stdout, stderr } = await execAsync(command);
            return {
                success: true,
                stdout: stdout.trim(),
                stderr: stderr.trim()
            };
        }
        catch (err) {
            this.log(`Command failed: ${err.message}`, 'error');
            return { success: false, error: err.message, stderr: err.stderr };
        }
    }
}
exports.CLIAgent = CLIAgent;
//# sourceMappingURL=CLIAgent.js.map