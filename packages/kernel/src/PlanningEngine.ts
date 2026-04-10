import { logger } from './Logger';
import { toolOrchestrator } from './ToolOrchestrator';
import { mcpRegistry } from './MCPRegistry';
import { configManager } from './ConfigManager';

export interface IPlanningStep {
    thought: string;
    action?: {
        tool: string;
        args: any;
    };
    observation?: string;
}

export interface IPlanningResult {
    goal: string;
    steps: IPlanningStep[];
    success: boolean;
    finalOutput?: string;
}

const SYSTEM_PROMPT = (toolList: string) => `You are an autonomous AI agent (AgentOS).
Your task is to complete a goal by reasoning step by step and using tools.

AVAILABLE TOOLS:
${toolList}

RESPONSE FORMAT — always reply with valid JSON:
{
  "thought": "<your reasoning about what to do next>",
  "action": {
    "tool": "<tool_name>",
    "args": { ... }
  }
}

To signal that the goal is complete, use this special action:
{
  "thought": "<final reasoning>",
  "action": {
    "tool": "FINISH",
    "args": { "output": "<final answer or summary>" }
  }
}

Rules:
- Only use tools from the AVAILABLE TOOLS list or FINISH.
- Never make up tool names.
- Be concise in your thoughts.
- If a tool fails, reflect on why and try another approach.`;

export class PlanningEngine {
    private static instance: PlanningEngine;

    private constructor() {}

    async init() {
        logger.info('PlanningEngine: Initialized');
    }

    static getInstance(): PlanningEngine {
        if (!PlanningEngine.instance) {
            PlanningEngine.instance = new PlanningEngine();
        }
        return PlanningEngine.instance;
    }

    async runAutonomousLoop(goal: string, maxSteps: number = 6): Promise<IPlanningResult> {
        logger.info(`PlanningEngine: Starting autonomous loop for goal: '${goal}'`);

        const steps: IPlanningStep[] = [];
        let success = false;
        let finalOutput = '';

        const cfg = configManager.getConfig();
        const apiKey = cfg.llm.apiKey || process.env.OPENAI_API_KEY;
        const useRealLLM = !!apiKey && (cfg.llm.provider === 'openai' || !cfg.llm.provider);

        // Build tool manifest string for the system prompt
        const tools = mcpRegistry.getToolDefinitions();
        const toolList = tools.length > 0
            ? tools.map(t => `- ${t.name}: ${t.description}`).join('\n')
            : '- execute_command: Run a shell command { command: string }';

        const messages: { role: string; content: string }[] = [
            { role: 'system', content: SYSTEM_PROMPT(toolList) },
            { role: 'user',   content: `Goal: ${goal}` },
        ];

        for (let stepNum = 0; stepNum < maxSteps; stepNum++) {
            logger.info(`PlanningEngine: Step ${stepNum + 1}/${maxSteps}`);

            let thought = `Step ${stepNum + 1} — analysing goal...`;
            let action: { tool: string; args: any } | undefined;

            if (useRealLLM) {
                try {
                    const { default: OpenAI } = await import('openai');
                    const client = new OpenAI({ apiKey });
                    const model = cfg.llm.model || 'gpt-4o-mini';

                    const response = await client.chat.completions.create({
                        model,
                        messages: messages as any,
                        temperature: 0.2,
                        response_format: { type: 'json_object' },
                    });

                    const raw = response.choices[0].message.content || '{}';
                    messages.push({ role: 'assistant', content: raw });

                    const parsed = JSON.parse(raw);
                    thought = parsed.thought || thought;
                    action  = parsed.action;
                } catch (llmErr: any) {
                    logger.warn(`PlanningEngine: LLM call failed: ${llmErr.message} — falling back to mock action`);
                    action = this.mockDecideAction(goal, steps);
                }
            } else {
                // No API key — use mock decision logic
                action = this.mockDecideAction(goal, steps);
                thought = `[Mock] ${thought}`;
            }

            // Check for FINISH
            if (!action || action.tool === 'FINISH') {
                success = true;
                finalOutput = action?.args?.output || 'Goal completed.';
                steps.push({ thought, action, observation: finalOutput });
                break;
            }

            // Execute the action via MCPRegistry or ToolOrchestrator
            let observation: string;
            try {
                const mcpResult = await mcpRegistry.invokeTool(action.tool, action.args);
                if (mcpResult.success) {
                    observation = JSON.stringify(mcpResult.data).slice(0, 800);
                } else {
                    // Fall back to ToolOrchestrator for built-in kernel tools
                    const toolResult = await toolOrchestrator.execute(action.tool, action.args);
                    observation = JSON.stringify(toolResult).slice(0, 800);
                }
            } catch (execErr: any) {
                observation = `Error: ${execErr.message}`;
            }

            // Append observation to conversation history for next iteration
            messages.push({ role: 'user', content: `Observation: ${observation}` });

            steps.push({ thought, action, observation });
        }

        if (!success) {
            finalOutput = `Reached max steps (${maxSteps}) without completing goal.`;
        }

        return { goal, steps, success, finalOutput };
    }

    /** Mock fallback when no LLM key is configured */
    private mockDecideAction(goal: string, history: IPlanningStep[]): { tool: string; args: any } | undefined {
        if (history.length >= 2) return undefined; // finish after 2 steps
        return {
            tool: 'execute_command',
            args: { command: `echo "Mock step for goal: ${goal}"` },
        };
    }
}

export const planningEngine = PlanningEngine.getInstance();


