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
exports.promptComposer = exports.PromptComposer = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Logger_1 = require("./Logger");
const Config_1 = require("./Config");
class PromptComposer {
    static instance;
    agentsDir;
    constructor() {
        this.agentsDir = Config_1.config.skills.dir;
    }
    static getInstance() {
        if (!PromptComposer.instance) {
            PromptComposer.instance = new PromptComposer();
        }
        return PromptComposer.instance;
    }
    async composeSystemPrompt(context) {
        const userSource = this.loadMarkdown('', 'USER.md');
        const agentsSource = this.loadMarkdown('instructions', 'AGENTS.md');
        const identitySource = this.loadMarkdown('soul', 'IDENTITY.md');
        const soulSource = this.loadMarkdown('soul', 'SOUL.md');
        const toolsSource = this.loadMarkdown('instructions', 'TOOLS.md');
        let prompt = `[USER & PROJECT CONTEXT]\n${userSource}\n\n`;
        prompt += `[SYSTEM IDENTITIES]\n${agentsSource}\n\n`;
        prompt += `[EXTERNAL IDENTITY & PRESENTATION]\n${identitySource}\n\n`;
        prompt += `[INTERNAL SOUL & PHILOSOPHY]\n${soulSource}\n\n`;
        prompt += `[TOOL CONVENTIONS]\n${toolsSource}\n\n`;
        if (context.additionalContext) {
            prompt += `[ADDITIONAL CONTEXT]\n${context.additionalContext}\n\n`;
        }
        prompt += `[CURRENT AGENT ROLE]\nYou are currently acting as: ${context.agentName}\n`;
        if (context.tools && context.tools.length > 0) {
            prompt += `Available Tools: ${context.tools.join(', ')}\n`;
        }
        Logger_1.logger.debug(`PromptComposer: Composed system prompt for ${context.agentName}`);
        return prompt;
    }
    loadMarkdown(subdir, filename) {
        const parentDir = path.resolve(this.agentsDir, '..'); // path to workspace/context
        const filePath = path.join(parentDir, subdir, filename);
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
        Logger_1.logger.warn(`PromptComposer: Missing expected prompt component at ${filePath}`);
        return '';
    }
}
exports.PromptComposer = PromptComposer;
exports.promptComposer = PromptComposer.getInstance();
//# sourceMappingURL=PromptComposer.js.map