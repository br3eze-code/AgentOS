"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PromptComposer_1 = require("./PromptComposer");
const Logger_1 = require("./Logger");
async function verifyWorkspace() {
    Logger_1.logger.info('--- Starting Workspace Architectural Verification ---');
    try {
        const prompt = await PromptComposer_1.promptComposer.composeSystemPrompt({
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
                Logger_1.logger.info(`✓ Found section: ${section}`);
            }
            else {
                Logger_1.logger.error(`✗ Missing section: ${section}`);
                allFound = false;
            }
        }
        if (allFound) {
            Logger_1.logger.info('SUCCESS: Workspace architectural alignment verified.');
        }
        else {
            Logger_1.logger.error('FAILURE: Some sections are missing in the composed prompt.');
            process.exit(1);
        }
    }
    catch (err) {
        Logger_1.logger.error('Verification failed with error:', err);
        process.exit(1);
    }
}
verifyWorkspace();
//# sourceMappingURL=verify-workspace.js.map