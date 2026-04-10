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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInteractiveMenu = runInteractiveMenu;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const table_1 = require("table");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CONFIG_DIR = path.join(os.homedir(), '.agentos');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        }
        catch { }
    }
    return { llm: { provider: 'openai', model: 'gpt-4o' } };
}
function saveConfig(updates) {
    const current = loadConfig();
    const merged = { ...current, ...updates };
    if (!fs.existsSync(CONFIG_DIR))
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
}
async function runInteractiveMenu(api) {
    console.clear();
    console.log(chalk_1.default.bold.cyan('\n  ╔══════════════════════════════════╗'));
    console.log(chalk_1.default.bold.cyan('  ║') + chalk_1.default.bold.white('   🧠 AgentOS Interactive Mode     ') + chalk_1.default.bold.cyan('║'));
    console.log(chalk_1.default.bold.cyan('  ╚══════════════════════════════════╝\n'));
    while (true) {
        const { action } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Main Menu:',
                choices: [
                    { name: '📂 Navigate System Data', value: 'nav' },
                    { name: '⚙️  Customize Settings', value: 'config' },
                    { name: '🧪 Testing & Sandbox', value: 'test' },
                    { name: '🏥 Health Check', value: 'status' },
                    new inquirer_1.default.Separator(),
                    { name: '❌ Exit', value: 'exit' },
                ],
            },
        ]);
        if (action === 'exit')
            break;
        try {
            switch (action) {
                case 'nav':
                    await handleNavigation(api);
                    break;
                case 'config':
                    await handleCustomization();
                    break;
                case 'test':
                    await handleTesting(api);
                    break;
                case 'status':
                    await handleStatus(api);
                    break;
            }
        }
        catch (err) {
            console.log(chalk_1.default.red(`\nError: ${err.response?.data?.error || err.message}\n`));
        }
    }
}
async function handleNavigation(api) {
    const { category } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'category',
            message: 'Select Data to View:',
            choices: [
                { name: '📶 Hotspots', value: 'hotspots' },
                { name: '🎫 Vouchers', value: 'vouchers' },
                { name: '👥 Users', value: 'users' },
                { name: '📊 Dashboard Summary', value: 'dashboard' },
                { name: '⬅️  Back', value: 'back' },
            ],
        },
    ]);
    if (category === 'back')
        return;
    const spinner = (0, ora_1.default)(`Fetching ${category}...`).start();
    try {
        if (category === 'hotspots') {
            const res = await api.get('/api/hotspots');
            spinner.stop();
            const rows = [['ID', 'Name', 'IP', 'Status', 'Location']];
            res.data.data.forEach((h) => rows.push([h.id.slice(0, 8), h.name, h.routerIp, h.isOnline ? chalk_1.default.green('ONLINE') : chalk_1.default.red('OFFLINE'), h.location || '-']));
            console.log('\n' + (0, table_1.table)(rows));
        }
        else if (category === 'vouchers') {
            const res = await api.get('/api/vouchers');
            spinner.stop();
            const rows = [['Code', 'Plan', 'Status', 'Expires']];
            res.data.data.items.slice(0, 15).forEach((v) => rows.push([chalk_1.default.bold(v.code), v.plan?.name || '-', v.status, v.validUntil ? new Date(v.validUntil).toLocaleDateString() : '-']));
            console.log('\n' + (0, table_1.table)(rows));
        }
        else if (category === 'users') {
            const res = await api.get('/api/admin/users');
            spinner.stop();
            const rows = [['Email', 'Role', 'Status']];
            res.data.data.forEach((u) => rows.push([u.email, u.role, chalk_1.default.green('ACTIVE')]));
            console.log('\n' + (0, table_1.table)(rows));
        }
        else if (category === 'dashboard') {
            const res = await api.get('/api/admin/dashboard');
            spinner.stop();
            const d = res.data.data;
            console.log(chalk_1.default.bold('\n--- Overview ---'));
            console.log(`  Users:    ${d.totalUsers}`);
            console.log(`  Vouchers: ${d.totalVouchers}`);
            console.log(`  Revenue:  $${d.totalRevenue.toFixed(2)}`);
        }
    }
    finally {
        spinner.stop();
    }
}
async function handleCustomization() {
    const cfg = loadConfig();
    const answers = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'provider',
            message: 'Select LLM Provider:',
            choices: ['openai', 'anthropic', 'google', 'ollama'],
            default: cfg.llm.provider,
        },
        {
            type: 'input',
            name: 'model',
            message: 'Enter Model Name:',
            default: (ans) => {
                const d = { openai: 'gpt-4o', anthropic: 'claude-3-5-sonnet-20241022', google: 'gemini-2.0-flash', ollama: 'llama3.2' };
                return d[ans.provider] || 'gpt-4o';
            },
        },
        {
            type: 'password',
            name: 'apiKey',
            message: 'Enter API Key (leave blank to keep current):',
            when: (ans) => ans.provider !== 'ollama',
            mask: '*',
        },
    ]);
    saveConfig({
        llm: {
            provider: answers.provider,
            model: answers.model,
            apiKey: answers.apiKey || cfg.llm.apiKey,
        },
    });
    console.log(chalk_1.default.green('\n✓ Configuration saved.\n'));
}
async function handleTesting(api) {
    const { tool } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'tool',
            message: 'Sandbox:',
            choices: [
                { name: '🤖 Agent Planner (Goal execution)', value: 'plan' },
                { name: '💬 ChatOps Chat', value: 'chat' },
                { name: '📋 Send WhatsApp', value: 'whatsapp' },
                { name: '⬅️  Back', value: 'back' },
            ],
        },
    ]);
    if (tool === 'back')
        return;
    if (tool === 'plan') {
        const { goal } = await inquirer_1.default.prompt([{ type: 'input', name: 'goal', message: 'Enter goal for the agent:' }]);
        const spinner = (0, ora_1.default)('Planning...').start();
        const res = await api.post('/api/system/plan', { goal });
        spinner.succeed('Goal handled.');
        console.log(chalk_1.default.cyan(res.data.data.finalOutput));
    }
    else if (tool === 'chat') {
        const { msg } = await inquirer_1.default.prompt([{ type: 'input', name: 'msg', message: 'Chat:' }]);
        const res = await api.post('/api/system/chat', { command: msg });
        console.log(chalk_1.default.green('\nResponse:'), res.data.data);
    }
    else if (tool === 'whatsapp') {
        const { to, msg } = await inquirer_1.default.prompt([
            { type: 'input', name: 'to', message: 'Recipient number:' },
            { type: 'input', name: 'msg', message: 'Message:' },
        ]);
        const res = await api.post('/api/channels/send', { channel: 'whatsapp', to, content: msg });
        console.log(res.data.success ? chalk_1.default.green('Sent!') : chalk_1.default.red('Failed.'));
    }
}
async function handleStatus(api) {
    const spinner = (0, ora_1.default)('Checking health...').start();
    try {
        const res = await api.get('/health');
        spinner.stop();
        const d = res.data.data;
        console.log(`\n  Kernel:  ${d.status === 'ONLINE' ? chalk_1.default.green('● ONLINE') : chalk_1.default.red('● ERROR')}`);
        console.log(`  Gateway: ${d.gateway.status === 'ONLINE' ? chalk_1.default.green('● ONLINE') : chalk_1.default.yellow('● WARNING')}`);
        console.log(`  Agents:  ${d.agents.length} active\n`);
    }
    catch {
        spinner.fail('Kernel unreachable. Ensure "npm run dev" is running in packages/api.');
    }
}
//# sourceMappingURL=interactive.js.map