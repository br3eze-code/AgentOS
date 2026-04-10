import { promptComposer } from './PromptComposer';
import { logger } from './Logger';

async function verifyPromptComposition() {
  logger.info('--- OPENCLAW PROMPT COMPOSITION TEST START ---');

  try {
    const prompt = await promptComposer.composeSystemPrompt({
      agentName: 'TestOrchestrator',
      additionalContext: 'Priority: Stabilization Audit',
      tools: ['deploy_hotspot', 'kick_session']
    });

    console.log('\n--- COMPOSED PROMPT ---\n');
    console.log(prompt);
    console.log('\n-----------------------\n');

    if (prompt.includes('[SYSTEM IDENTITIES]') && 
        prompt.includes('[EXTERNAL IDENTITY & PRESENTATION]') &&
        prompt.includes('[INTERNAL SOUL & PHILOSOPHY]') &&
        prompt.includes('ClawRouterOS') && 
        prompt.includes('TestOrchestrator')) {
      logger.info('SUCCESS: Prompt composer correctly assembled the components including IDENTITY.md.');
    } else {
      throw new Error('Prompt verification failed: Missing key sections (System, Identity, or Soul).');
    }

  } catch (err: any) {
    logger.error(`FAILURE: ${err.message}`);
    process.exit(1);
  }

  logger.info('--- OPENCLAW PROMPT COMPOSITION TEST END ---');
}

verifyPromptComposition();
