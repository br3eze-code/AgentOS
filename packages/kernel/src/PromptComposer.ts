import * as fs from 'fs';
import * as path from 'path';
import { logger } from './Logger';
import { config } from './Config';

export interface PromptContext {
  agentName: string;
  additionalContext?: string;
  tools?: string[];
}

export class PromptComposer {
  private static instance: PromptComposer;
  private agentsDir: string;

  private constructor() {
    this.agentsDir = config.skills.dir;
  }

  static getInstance(): PromptComposer {
    if (!PromptComposer.instance) {
      PromptComposer.instance = new PromptComposer();
    }
    return PromptComposer.instance;
  }

  async composeSystemPrompt(context: PromptContext): Promise<string> {
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

    logger.debug(`PromptComposer: Composed system prompt for ${context.agentName}`);
    return prompt;
  }

  private loadMarkdown(subdir: string, filename: string): string {
    const parentDir = path.resolve(this.agentsDir, '..'); // path to workspace/context
    const filePath = path.join(parentDir, subdir, filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    logger.warn(`PromptComposer: Missing expected prompt component at ${filePath}`);
    return '';
  }
}

export const promptComposer = PromptComposer.getInstance();
