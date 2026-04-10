import { promptComposer } from './PromptComposer';
import { logger } from './Logger';

async function verifyWorkspace() {
  logger.info('--- Starting Workspace Architectural Verification ---');
  
  try {
    const prompt = await promptComposer.composeSystemPrompt({
      agentName: 'VerificationAgent',
      additionalContext: 'Verifying root workspace alignment.',
      tools: ['status_check', 'heartbeat_ping']
    });

    console.log('--- COMPOSED PROMPT START ---');
    console.log(prompt);
    console.log('--- COMPOSED PROMPT END ---');

    const sections = [
      '[USER & PROJECT CONTEXT]',
      '[SYSTEM IDENTITIES]',
      '[EXTERNAL IDENTITY & PRESENTATION]',
      '[INTERNAL SOUL & PHILOSOPHY]',
      '[TOOL CONVENTIONS]'
    ];

    let allFound = true;
    for (const section of sections) {
      if (prompt.includes(section)) {
        logger.info(`✓ Found section: ${section}`);
      } else {
        logger.error(`✗ Missing section: ${section}`);
        allFound = false;
      }
    }

    if (allFound) {
      logger.info('SUCCESS: Workspace architectural alignment verified.');
    } else {
      logger.error('FAILURE: Some sections are missing in the composed prompt.');
      process.exit(1);
    }
  } catch (err) {
    logger.error('Verification failed with error:', err);
    process.exit(1);
  }
}

verifyWorkspace();
