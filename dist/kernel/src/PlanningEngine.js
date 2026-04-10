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
exports.planningEngine = exports.PlanningEngine = void 0;
const Logger_1 = require("./Logger");
const ToolOrchestrator_1 = require("./ToolOrchestrator");
const MCPRegistry_1 = require("./MCPRegistry");
const ConfigManager_1 = require("./ConfigManager");
const SYSTEM_PROMPT = (toolList) => `You are an autonomous AI agent (AgentOS).
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
class PlanningEngine {
    static instance;
    constructor() { }
    async init() {
        Logger_1.logger.info('PlanningEngine: Initialized');
    }
    static getInstance() {
        if (!PlanningEngine.instance) {
            PlanningEngine.instance = new PlanningEngine();
        }
        return PlanningEngine.instance;
    }
    async runAutonomousLoop(goal, maxSteps = 6) {
        Logger_1.logger.info(`PlanningEngine: Starting autonomous loop for goal: '${goal}'`);
        const steps = [];
        let success = false;
        let finalOutput = '';
        const cfg = ConfigManager_1.configManager.getConfig();
        const apiKey = cfg.llm.apiKey || process.env.OPENAI_API_KEY;
        const useRealLLM = !!apiKey && (cfg.llm.provider === 'openai' || !cfg.llm.provider);
        // Build tool manifest string for the system prompt
        const tools = MCPRegistry_1.mcpRegistry.getToolDefinitions();
        const toolList = tools.length > 0
            ? tools.map(t => `- ${t.name}: ${t.description}`).join('\n')
            : '- execute_command: Run a shell command { command: string }';
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT(toolList) },
            { role: 'user', content: `Goal: ${goal}` },
        ];
        for (let stepNum = 0; stepNum < maxSteps; stepNum++) {
            Logger_1.logger.info(`PlanningEngine: Step ${stepNum + 1}/${maxSteps}`);
            let thought = `Step ${stepNum + 1} — analysing goal...`;
            let action;
            if (useRealLLM) {
                try {
                    const { default: OpenAI } = await Promise.resolve().then(() => __importStar(require('openai')));
                    const client = new OpenAI({ apiKey });
                    const model = cfg.llm.model || 'gpt-4o-mini';
                    const response = await client.chat.completions.create({
                        model,
                        messages: messages,
                        temperature: 0.2,
                        response_format: { type: 'json_object' },
                    });
                    const raw = response.choices[0].message.content || '{}';
                    messages.push({ role: 'assistant', content: raw });
                    const parsed = JSON.parse(raw);
                    thought = parsed.thought || thought;
                    action = parsed.action;
                }
                catch (llmErr) {
                    Logger_1.logger.warn(`PlanningEngine: LLM call failed: ${llmErr.message} — falling back to mock action`);
                    action = this.mockDecideAction(goal, steps);
                }
            }
            else {
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
            let observation;
            try {
                const mcpResult = await MCPRegistry_1.mcpRegistry.invokeTool(action.tool, action.args);
                if (mcpResult.success) {
                    observation = JSON.stringify(mcpResult.data).slice(0, 800);
                }
                else {
                    // Fall back to ToolOrchestrator for built-in kernel tools
                    const toolResult = await ToolOrchestrator_1.toolOrchestrator.execute(action.tool, action.args);
                    observation = JSON.stringify(toolResult).slice(0, 800);
                }
            }
            catch (execErr) {
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
    mockDecideAction(goal, history) {
        if (history.length >= 2)
            return undefined; // finish after 2 steps
        return {
            tool: 'execute_command',
            args: { command: `echo "Mock step for goal: ${goal}"` },
        };
    }
}
exports.PlanningEngine = PlanningEngine;
exports.planningEngine = PlanningEngine.getInstance();
//# sourceMappingURL=PlanningEngine.js.map