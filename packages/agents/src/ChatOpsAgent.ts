import { toolOrchestrator } from '@agentclaw/kernel';
import { BaseAgent } from './BaseAgent';
import { z } from 'zod';

export class ChatOpsAgent extends BaseAgent {
    constructor() {
        super('chatops-agent', 'ChatOps Agent', 'Natural Language interface for AgentOS operations');
    }

    async start(): Promise<void> {
        this.log('Starting ChatOps Agent...');
        
        toolOrchestrator.registerTool({
            name: 'parse_nlp',
            description: 'Parse natural language command into an actionable intent',
            inputSchema: z.object({
                command: z.string().describe('The natural language command to parse')
            }),
            handler: async (args: any) => this.parseNLP(args.command)
        });

        this.status = 'IDLE';
    }

    async stop(): Promise<void> {
        this.log('Stopping ChatOps Agent...');
    }

    private async parseNLP(command: string) {
        this.log(`Processing: ${command}`);
        const cmd = command.toLowerCase();

        if (cmd.includes('generate') && cmd.includes('voucher')) {
            const quantity = parseInt(cmd.match(/\d+/)?.[0] || '1');
            return {
                tool: 'generate_vouchers',
                parameters: { quantity, plan_id: 'auto' },
                message: `I've prepared a request to generate ${quantity} vouchers.`
            };
        }

        if (cmd.includes('status') || cmd.includes('check hotspot')) {
            return {
                tool: 'get_hotspot_status',
                parameters: { hotspot_id: 'default' },
                message: 'Checking the status of the primary hotspot...'
            };
        }

        return {
            tool: 'unknown',
            message: "I'm not sure how to handle that command yet. Try asking for a 'sales report' or 'generate 5 vouchers'."
        };
    }
}
