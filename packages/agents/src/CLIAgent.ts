import { toolOrchestrator } from '@agentclaw/kernel';
import { BaseAgent } from './BaseAgent';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

const execAsync = promisify(exec);

export class CLIAgent extends BaseAgent {
    constructor() {
        super('cli-agent', 'CLI Agent', 'High-privileged tool bridge for system operations');
    }

    async start(): Promise<void> {
        this.log('Starting CLI Agent...');
        
        // Register tools with the orchestrator
        toolOrchestrator.registerTool({
            name: 'execute_command',
            description: 'Execute a system CLI command',
            inputSchema: z.object({
                command: z.string().describe('The command to execute'),
                bg: z.boolean().optional().describe('Whether to run in background')
            }),
            handler: async (args: any) => this.executeCommand(args)
        });

        this.status = 'IDLE';
    }

    async stop(): Promise<void> {
        this.log('Stopping CLI Agent...');
    }

    private async executeCommand(inputs: any) {
        const { command, bg } = inputs;
        this.log(`Executing command: ${command}`);

        try {
            if (bg) {
                exec(command); // Flame and forget
                return { success: true, status: 'spawned' };
            }

            const { stdout, stderr } = await execAsync(command);
            return { 
                success: true, 
                stdout: stdout.trim(), 
                stderr: stderr.trim() 
            };
        } catch (err: any) {
            this.log(`Command failed: ${err.message}`, 'error');
            return { success: false, error: err.message, stderr: err.stderr };
        }
    }
}
