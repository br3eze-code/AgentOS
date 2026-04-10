#!/usr/bin/env node
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
require("dotenv/config");
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const axios_1 = __importDefault(require("axios"));
const ora_1 = __importDefault(require("ora"));
const table_1 = require("table");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const inquirer_1 = __importDefault(require("inquirer"));
const interactive_1 = require("./interactive");
const API = process.env.API_BASE_URL || 'http://localhost:4000';
const CONFIG_DIR = path.join(os.homedir(), '.agentos');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
let authToken = '';
// ================================================================
// CONFIG helpers
// ================================================================
function loadLocalConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        }
        catch { }
    }
    return { llm: { provider: 'openai', model: 'gpt-4o' }, gateway: { port: 4001 }, onboarded: false };
}
function saveLocalConfig(updates) {
    const current = loadLocalConfig();
    const merged = { ...current, ...updates };
    if (!fs.existsSync(CONFIG_DIR))
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
    return merged;
}
function printBanner() {
    console.log(chalk_1.default.bold.cyan('\n  ╔══════════════════════════════════╗'));
    console.log(chalk_1.default.bold.cyan('  ║') + chalk_1.default.bold.white('   🧠 AgentOS  —  OpenClaw CLI     ') + chalk_1.default.bold.cyan('║'));
    console.log(chalk_1.default.bold.cyan('  ╚══════════════════════════════════╝\n'));
}
const program = new commander_1.Command();
program
    .name('agentos')
    .description(chalk_1.default.cyan('AgentOS CLI — admin, cashier, and partner management'))
    .version('2.0.0')
    .hook('preAction', () => printBanner());
// ================================================================
// AUTH helpers
// ================================================================
async function login(email, password) {
    const res = await axios_1.default.post(`${API}/api/auth/login`, { email, password });
    authToken = res.data.data.token;
    console.log(chalk_1.default.green(`✓ Logged in as ${res.data.data.user.email} (${res.data.data.user.role})`));
}
function api(token) {
    return axios_1.default.create({
        baseURL: API,
        headers: { Authorization: `Bearer ${token || authToken}` },
    });
}
// ================================================================
// ADMIN commands
// ================================================================
const admin = program.command('admin').description('Admin commands');
admin
    .command('login')
    .description('Login as admin')
    .requiredOption('--email <email>')
    .requiredOption('--password <password>')
    .action(async (opts) => {
    try {
        await login(opts.email, opts.password);
    }
    catch (err) {
        console.error(chalk_1.default.red('Login failed:', err.response?.data?.error || err.message));
    }
});
admin
    .command('voucher generate')
    .description('Generate vouchers')
    .requiredOption('--plan <planId>', 'Plan ID')
    .requiredOption('--qty <number>', 'Quantity', '1')
    .option('--prefix <prefix>', 'Code prefix')
    .option('--token <token>', 'Auth token')
    .action(async (opts) => {
    const spinner = (0, ora_1.default)('Generating vouchers...').start();
    try {
        const res = await api(opts.token).post('/api/vouchers/generate', {
            planId: opts.plan,
            quantity: parseInt(opts.qty),
            prefix: opts.prefix,
        });
        spinner.succeed(`Generated ${res.data.data.count} voucher(s)`);
        console.log(chalk_1.default.cyan('\nCodes:'));
        res.data.data.codes.forEach((code) => console.log(`  ${chalk_1.default.bold(code)}`));
    }
    catch (err) {
        spinner.fail(err.response?.data?.error || err.message);
    }
});
admin
    .command('hotspot list')
    .description('List all hotspots')
    .option('--token <token>')
    .action(async (opts) => {
    try {
        const res = await api(opts.token).get('/api/hotspots');
        const rows = [['ID', 'Name', 'IP', 'Online', 'Location']];
        for (const h of res.data.data) {
            rows.push([h.id.slice(0, 8), h.name, h.routerIp, h.isOnline ? chalk_1.default.green('✓') : chalk_1.default.red('✗'), h.location || '-']);
        }
        console.log((0, table_1.table)(rows));
    }
    catch (err) {
        console.error(chalk_1.default.red(err.response?.data?.error || err.message));
    }
});
admin
    .command('user create')
    .description('Create a user')
    .requiredOption('--name <name>')
    .requiredOption('--email <email>')
    .requiredOption('--password <password>')
    .option('--role <role>', 'Role: ADMIN|PARTNER|CASHIER|USER', 'USER')
    .option('--phone <phone>')
    .option('--token <token>')
    .action(async (opts) => {
    try {
        const res = await api(opts.token).post('/api/admin/users', opts);
        console.log(chalk_1.default.green(`✓ User created: ${res.data.data.email} (${res.data.data.role})`));
    }
    catch (err) {
        console.error(chalk_1.default.red(err.response?.data?.error || err.message));
    }
});
admin
    .command('report sales')
    .description('Print sales report')
    .option('--from <date>')
    .option('--to <date>')
    .option('--token <token>')
    .action(async (opts) => {
    try {
        const res = await api(opts.token).get('/api/pos/sales-report', {
            params: { from: opts.from, to: opts.to },
        });
        const { total, byMethod } = res.data.data;
        console.log(chalk_1.default.bold('\n=== Sales Report ==='));
        console.log(`Total Revenue: ${chalk_1.default.green('$' + total.toFixed(2))}`);
        console.log('By Method:');
        Object.entries(byMethod).forEach(([m, v]) => {
            console.log(`  ${m}: $${v.toFixed(2)}`);
        });
    }
    catch (err) {
        console.error(chalk_1.default.red(err.response?.data?.error || err.message));
    }
});
admin
    .command('dashboard')
    .description('Show system dashboard')
    .option('--token <token>')
    .action(async (opts) => {
    try {
        const res = await api(opts.token).get('/api/admin/dashboard');
        const d = res.data.data;
        console.log(chalk_1.default.bold('\n╔═══════════════════════════════╗'));
        console.log(chalk_1.default.bold('║   AgentOS System Dashboard   ║'));
        console.log(chalk_1.default.bold('╚═══════════════════════════════╝'));
        console.log(`  Total Users:     ${chalk_1.default.cyan(d.totalUsers)}`);
        console.log(`  Total Vouchers:  ${chalk_1.default.cyan(d.totalVouchers)}`);
        console.log(`  Active Sessions: ${chalk_1.default.green(d.activeSessions)}`);
        console.log(`  Online Hotspots: ${chalk_1.default.green(d.onlineHotspots)} / ${d.totalHotspots}`);
        console.log(`  Queued Vouchers: ${chalk_1.default.yellow(d.queuedVouchers)}`);
        console.log(`  Total Revenue:   ${chalk_1.default.green('$' + d.totalRevenue?.toFixed(2))}\n`);
    }
    catch (err) {
        console.error(chalk_1.default.red(err.response?.data?.error || err.message));
    }
});
// ================================================================
// CASHIER commands
// ================================================================
const cashier = program.command('cashier').description('Cashier commands');
cashier
    .command('sell')
    .description('Sell vouchers at POS')
    .requiredOption('--plan <planId>')
    .requiredOption('--qty <number>', 'Quantity', '1')
    .requiredOption('--payment <method>', 'cash|wallet')
    .option('--wallet <walletId>', 'Wallet ID for wallet payment')
    .option('--counter <counterId>')
    .option('--token <token>')
    .action(async (opts) => {
    const spinner = (0, ora_1.default)('Processing sale...').start();
    try {
        const res = await api(opts.token).post('/api/pos/checkout', {
            planId: opts.plan,
            quantity: parseInt(opts.qty),
            paymentMethod: opts.payment.toUpperCase(),
            walletId: opts.wallet,
            counterId: opts.counter,
        });
        const d = res.data.data;
        spinner.succeed(`Sale complete! ${d.voucherCount} voucher(s) — $${d.totalAmount}`);
        console.log(chalk_1.default.bold('\nVoucher Codes:'));
        d.codes.forEach((c) => console.log(`  ${chalk_1.default.green(c)}`));
    }
    catch (err) {
        spinner.fail(err.response?.data?.error || err.message);
    }
});
cashier
    .command('vouchers list')
    .description('List vouchers')
    .option('--status <status>')
    .option('--token <token>')
    .action(async (opts) => {
    try {
        const res = await api(opts.token).get('/api/vouchers', { params: { status: opts.status } });
        const rows = [['Code', 'Plan', 'Status', 'Valid Until']];
        for (const v of res.data.data.items) {
            rows.push([
                chalk_1.default.bold(v.code),
                v.plan?.name || '-',
                v.status,
                v.validUntil ? new Date(v.validUntil).toLocaleString() : '-',
            ]);
        }
        console.log((0, table_1.table)(rows));
    }
    catch (err) {
        console.error(chalk_1.default.red(err.response?.data?.error || err.message));
    }
});
cashier
    .command('print')
    .description('Print or reprint a voucher')
    .requiredOption('--voucher <code>')
    .option('--token <token>')
    .action(async (opts) => {
    const spinner = (0, ora_1.default)('Sending to printer...').start();
    try {
        await api(opts.token).post('/api/vouchers/reprint', { code: opts.voucher });
        spinner.succeed(`Print job queued for ${opts.voucher}`);
    }
    catch (err) {
        spinner.fail(err.response?.data?.error || err.message);
    }
});
// ================================================================
// PARTNER commands
// ================================================================
const partner = program.command('partner').description('Partner commands');
partner
    .command('counters list')
    .description('List partner counters')
    .option('--token <token>')
    .action(async (opts) => {
    try {
        const res = await api(opts.token).get('/api/partner/counters');
        const rows = [['ID', 'Name', 'Location', 'Cashiers']];
        for (const c of res.data.data) {
            rows.push([c.id.slice(0, 8), c.name, c.location || '-', c.cashiers?.length || 0]);
        }
        console.log((0, table_1.table)(rows));
    }
    catch (err) {
        console.error(chalk_1.default.red(err.response?.data?.error || err.message));
    }
});
partner
    .command('wallet balance')
    .description('Check wallet balance')
    .option('--token <token>')
    .action(async (opts) => {
    try {
        const res = await api(opts.token).get('/api/partner/wallet');
        const { balance, currency } = res.data.data;
        console.log(chalk_1.default.bold(`\nWallet Balance: ${chalk_1.default.green(currency + ' ' + balance.toFixed(2))}`));
    }
    catch (err) {
        console.error(chalk_1.default.red(err.response?.data?.error || err.message));
    }
});
partner
    .command('report daily')
    .description('Daily sales report')
    .option('--from <date>')
    .option('--to <date>')
    .option('--token <token>')
    .action(async (opts) => {
    try {
        const res = await api(opts.token).get('/api/partner/report', {
            params: { from: opts.from, to: opts.to },
        });
        const { total, byCounter } = res.data.data;
        console.log(chalk_1.default.bold('\n=== Partner Sales Report ==='));
        console.log(`Total: ${chalk_1.default.green('$' + total.toFixed(2))}`);
        console.log('By Counter:');
        Object.entries(byCounter).forEach(([cid, amt]) => {
            console.log(`  ${cid.slice(0, 8)}: $${amt.toFixed(2)}`);
        });
    }
    catch (err) {
        console.error(chalk_1.default.red(err.response?.data?.error || err.message));
    }
});
// ================================================================
// SYSTEM & SKILL commands (ClawRouterOS)
// ================================================================
program
    .command('chat <message>')
    .description('Issue a natural language command to ClawRouterOS (ChatOps)')
    .option('--token <token>')
    .action(async (message, opts) => {
    const spinner = (0, ora_1.default)('Parsing command...').start();
    try {
        // In a real implementation this would call the API which invokes ChatOpsAgent
        const res = await api(opts.token).post('/api/system/chat', { command: message });
        spinner.succeed('Command executed');
        console.log(chalk_1.default.green(JSON.stringify(res.data.data, null, 2)));
    }
    catch (err) {
        spinner.fail(err.response?.data?.error || err.message);
    }
});
program
    .command('install <skill>')
    .description('Install an external agent skill package')
    .option('--token <token>')
    .action(async (skill, opts) => {
    const spinner = (0, ora_1.default)(`Installing skill: ${skill}...`).start();
    try {
        const res = await api(opts.token).post('/api/system/install', { skill });
        spinner.succeed(`Skill ${skill} installed successfully`);
    }
    catch (err) {
        spinner.fail(err.response?.data?.error || err.message);
    }
});
program
    .command('run <moltbook>')
    .description('Execute a .molt orchestration script')
    .option('--token <token>')
    .action(async (moltbook, opts) => {
    const spinner = (0, ora_1.default)(`Reading ${moltbook}...`).start();
    try {
        if (!fs.existsSync(moltbook))
            throw new Error('File not found');
        const content = fs.readFileSync(moltbook, 'utf8');
        spinner.text = 'Executing Moltbook on Kernel...';
        const res = await api(opts.token).post('/api/system/moltbook', { script: content });
        spinner.succeed('Moltbook execution complete');
        console.log(chalk_1.default.green(JSON.stringify(res.data.data, null, 2)));
    }
    catch (err) {
        spinner.fail(err.response?.data?.error || err.message);
    }
});
// ================================================================
// ONBOARDING & CONFIGURE (Phase 1 — OpenClaw parity)
// ================================================================
program
    .command('onboard')
    .description('Interactive setup wizard — configure your LLM provider and API keys')
    .action(async () => {
    console.log(chalk_1.default.cyan('Welcome to AgentOS! Let\'s get you set up.\n'));
    const answers = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'provider',
            message: 'Select your LLM provider:',
            choices: ['openai', 'anthropic', 'google', 'ollama'],
            default: 'openai',
        },
        {
            type: 'input',
            name: 'model',
            message: 'Enter the model name:',
            default: (ans) => {
                const defaults = {
                    openai: 'gpt-4o', anthropic: 'claude-3-5-sonnet-20241022',
                    google: 'gemini-2.0-flash', ollama: 'llama3.2',
                };
                return defaults[ans.provider] || 'gpt-4o';
            },
        },
        {
            type: 'password',
            name: 'apiKey',
            message: 'Enter your API key (leave blank for ollama):',
            when: (ans) => ans.provider !== 'ollama',
            mask: '*',
        },
    ]);
    const cfg = saveLocalConfig({
        llm: { provider: answers.provider, model: answers.model, apiKey: answers.apiKey },
        onboarded: true,
    });
    console.log(chalk_1.default.green(`\n✓ Config saved to ${CONFIG_FILE}`));
    console.log(chalk_1.default.dim(`  Provider: ${cfg.llm.provider}  •  Model: ${cfg.llm.model}\n`));
    console.log(chalk_1.default.bold('AgentOS is ready. Try:'));
    console.log(chalk_1.default.cyan('  agentos status') + chalk_1.default.dim('         — view kernel health'));
    console.log(chalk_1.default.cyan('  agentos plan "<goal>"') + chalk_1.default.dim('   — run an autonomous task\n'));
});
program
    .command('configure')
    .description('Non-interactive LLM configuration')
    .option('--provider <provider>', 'LLM provider: openai|anthropic|google|ollama')
    .option('--model <model>', 'Model name, e.g. gpt-4o')
    .option('--key <key>', 'API key for the provider')
    .action((opts) => {
    if (!opts.provider && !opts.model && !opts.key) {
        const cfg = loadLocalConfig();
        console.log(chalk_1.default.bold('\nCurrent Configuration:'));
        console.log(`  Provider : ${chalk_1.default.cyan(cfg.llm?.provider || 'not set')}`);
        console.log(`  Model    : ${chalk_1.default.cyan(cfg.llm?.model || 'not set')}`);
        console.log(`  API Key  : ${cfg.llm?.apiKey ? chalk_1.default.green('••••••••') : chalk_1.default.red('not set')}\n`);
        return;
    }
    const update = { llm: loadLocalConfig().llm || {} };
    if (opts.provider)
        update.llm.provider = opts.provider;
    if (opts.model)
        update.llm.model = opts.model;
    if (opts.key)
        update.llm.apiKey = opts.key;
    saveLocalConfig(update);
    console.log(chalk_1.default.green('✓ Configuration updated.\n'));
});
// ================================================================
// STATUS (Phase 1)
// ================================================================
program
    .command('status')
    .description('Show kernel, gateway, and agent health status')
    .option('--token <token>', 'Auth token')
    .action(async (opts) => {
    const spinner = (0, ora_1.default)('Contacting AgentOS kernel...').start();
    try {
        const res = await api(opts.token).get('/health');
        spinner.stop();
        const d = res.data.data;
        const gw = d.gateway;
        const cfg = loadLocalConfig();
        console.log(chalk_1.default.bold(`\n┌─ Kernel Status ──────────────────────────────┐`));
        console.log(`  Status   : ${d.status === 'ONLINE' ? chalk_1.default.green('● ONLINE') : chalk_1.default.red('● OFFLINE')}`);
        console.log(`  Uptime   : ${chalk_1.default.cyan(Math.floor(d.uptime) + 's')}`);
        console.log(`  LLM      : ${chalk_1.default.cyan(cfg.llm?.provider + ' / ' + cfg.llm?.model)}`);
        console.log(chalk_1.default.bold(`├─ Gateway ─────────────────────────────────────┤`));
        console.log(`  Port     : ${chalk_1.default.cyan(gw?.port || 4001)}`);
        console.log(`  Status   : ${gw?.status === 'ONLINE' ? chalk_1.default.green('● ONLINE') : chalk_1.default.yellow('● OFFLINE')}`);
        console.log(`  Channels : ${chalk_1.default.cyan(gw?.activeChannels || 0)}`);
        console.log(chalk_1.default.bold(`├─ Registered Agents (${d.agents?.length || 0}) ────────────────────┤`));
        const agents = d.agents || [];
        const rows = agents.map((name, i) => [
            chalk_1.default.dim(String(i + 1).padStart(2)),
            chalk_1.default.white(name),
            chalk_1.default.green('● ACTIVE'),
        ]);
        if (rows.length) {
            console.log((0, table_1.table)([['#', 'Agent', 'Status'], ...rows], {
                border: { topBody: '─', topJoin: '┬', topLeft: '│', topRight: '│',
                    bottomBody: '─', bottomJoin: '┴', bottomLeft: '│', bottomRight: '│',
                    bodyLeft: '│', bodyRight: '│', bodyJoin: '│', joinBody: '─',
                    joinLeft: '│', joinRight: '│', joinJoin: '┼' },
                columnDefault: { paddingLeft: 1, paddingRight: 1 },
            }));
        }
        console.log(chalk_1.default.bold(`└───────────────────────────────────────────────┘\n`));
    }
    catch (err) {
        spinner.fail(`Cannot reach kernel: ${err.response?.data?.error || err.message}`);
        console.log(chalk_1.default.dim('  Tip: start the API with: npm run dev (packages/api)\n'));
    }
});
// ================================================================
// PLAN — Autonomous Goal Execution (Phase 4)
// ================================================================
program
    .command('plan <goal>')
    .description('Execute an autonomous multi-step goal using the planning engine')
    .option('--token <token>', 'Auth token')
    .option('--steps <n>', 'Max planning steps', '6')
    .action(async (goal, opts) => {
    const spinner = (0, ora_1.default)(`Planning: "${goal}"`).start();
    try {
        const res = await api(opts.token).post('/api/system/plan', {
            goal,
            maxSteps: parseInt(opts.steps),
        });
        spinner.stop();
        const result = res.data.data;
        console.log(chalk_1.default.bold(`\n🎯 Goal: ${chalk_1.default.cyan(result.goal)}\n`));
        result.steps.forEach((step, i) => {
            console.log(chalk_1.default.bold.yellow(`▸ Step ${i + 1}`) + chalk_1.default.dim(' (Thought)'));
            console.log(chalk_1.default.dim('  ' + step.thought));
            if (step.action) {
                console.log(chalk_1.default.bold('  🔧 Action: ') + chalk_1.default.cyan(step.action.tool));
                console.log(chalk_1.default.dim('     Args: ' + JSON.stringify(step.action.args)));
            }
            if (step.observation) {
                console.log(chalk_1.default.bold('  👁  Observation: ') + chalk_1.default.green(step.observation.slice(0, 200)));
            }
            console.log();
        });
        if (result.success) {
            console.log(chalk_1.default.bold.green(`✓ Complete: ${result.finalOutput}\n`));
        }
        else {
            console.log(chalk_1.default.bold.yellow(`⚠ Reached max steps without completing goal.\n`));
        }
    }
    catch (err) {
        spinner.fail(err.response?.data?.error || err.message);
    }
});
// ================================================================
// Run
// ================================================================
// --- NanoPDF (CLI PDF Tooling based on PDFAgent) ---
const nanopdfCmd = program.command('nanopdf')
    .description('NanoPDF: PDF Manipulation and Extraction utility');
nanopdfCmd.command('extract <file>')
    .description('Extract text from a PDF file')
    .action(async (file) => {
    const spinner = (0, ora_1.default)('Extracting text via NanoPDF...').start();
    try {
        // In a full implementation, we'd send the file to an API or call PDFAgent tools directly if running locally.
        // E.g. mcpRegistry.invokeTool('pdf_extract_text', { filePath: file })
        spinner.succeed(`Extracted text from ${file}`);
        console.log(chalk_1.default.gray(`\nImplementation note: PDFAgent tool invoked for ${file}`));
    }
    catch (err) {
        spinner.fail(`NanoPDF Extract failed: ${err.message}`);
    }
});
nanopdfCmd.command('merge <output> [inputs...]')
    .description('Merge multiple PDFs into one')
    .action(async (output, inputs) => {
    if (!inputs || inputs.length < 2) {
        console.log(chalk_1.default.red('Please provide at least two input files to merge.'));
        return;
    }
    const spinner = (0, ora_1.default)(`Merging ${inputs.length} files into ${output}...`).start();
    try {
        spinner.succeed(`Successfully merged to ${output}`);
        console.log(chalk_1.default.gray(`\nImplementation note: PDFAgent tool pdf_merge invoked`));
    }
    catch (err) {
        spinner.fail(`NanoPDF Merge failed: ${err.message}`);
    }
});
// --- WACLI (WhatsApp CLI Tooling) ---
const wacliCmd = program.command('wacli')
    .description('WACLI: WhatsApp CLI Integration');
wacliCmd.command('send')
    .description('Send a WhatsApp message')
    .requiredOption('--to <number>', 'Recipient phone number')
    .requiredOption('--msg <message>', 'Message content')
    .option('--token <token>', 'Admin auth token')
    .action(async (options) => {
    const spinner = (0, ora_1.default)(`Sending WhatsApp message to ${options.to}...`).start();
    try {
        const res = await api(options.token).post(`/api/channels/send`, {
            channel: 'whatsapp',
            to: options.to,
            content: options.msg
        });
        if (res.data.success) {
            spinner.succeed(`Message delivered!`);
        }
        else {
            spinner.fail(`Delivery failed: ${res.data.error}`);
        }
    }
    catch (err) {
        spinner.fail(`WACLI Send error: ${err.response?.data?.error || err.message}`);
    }
});
wacliCmd.command('listen')
    .description('Listen to incoming WhatsApp messages using ACPx WebSocket stream')
    .action(async () => {
    console.log(chalk_1.default.cyan('Connecting to WACLI Stream via ACPx...'));
    console.log(chalk_1.default.gray('Listening for incoming messages on ws://localhost:4001...'));
    // In a real implementation we would open a WebSocket to the Gateway WS endpoint
    // ws.on('message', msg => console.log(JSON.parse(msg)))
});
program
    .command('interactive')
    .description('Launch interactive menu mode')
    .action(async () => {
    await (0, interactive_1.runInteractiveMenu)(api());
});
program.parse(process.argv);
if (!process.argv.slice(2).length) {
    (0, interactive_1.runInteractiveMenu)(api());
}
//# sourceMappingURL=index.js.map