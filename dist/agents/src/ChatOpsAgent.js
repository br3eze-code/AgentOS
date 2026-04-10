"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatOpsAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
const BaseAgent_1 = require("./BaseAgent");
const zod_1 = require("zod");
class ChatOpsAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super('chatops-agent', 'ChatOps Agent', 'Natural Language interface for AgentOS operations');
    }
    async start() {
        this.log('Starting ChatOps Agent...');
        kernel_1.toolOrchestrator.registerTool({
            name: 'parse_nlp',
            description: 'Parse natural language command into an actionable intent',
            inputSchema: zod_1.z.object({
                command: zod_1.z.string().describe('The natural language command to parse')
            }),
            handler: async (args) => this.parseNLP(args.command)
        });
        this.status = 'IDLE';
    }
    async stop() {
        this.log('Stopping ChatOps Agent...');
    }
    async parseNLP(command) {
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
exports.ChatOpsAgent = ChatOpsAgent;
//# sourceMappingURL=ChatOpsAgent.js.map