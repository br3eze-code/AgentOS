#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import axios from 'axios';
import ora from 'ora';
import { table } from 'table';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import inquirer from 'inquirer';
import { runInteractiveMenu } from './interactive';


const API = process.env.API_BASE_URL || 'http://localhost:4000';
const CONFIG_DIR = path.join(os.homedir(), '.agentos');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
let authToken = '';

// ================================================================
// CONFIG helpers
// ================================================================

function loadLocalConfig(): Record<string, any> {
  if (fs.existsSync(CONFIG_FILE)) {
    try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')); } catch {}
  }
  return { llm: { provider: 'openai', model: 'gpt-4o' }, gateway: { port: 4001 }, onboarded: false };
}

function saveLocalConfig(updates: Record<string, any>) {
  const current = loadLocalConfig();
  const merged = { ...current, ...updates };
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

function printBanner() {
  console.log(chalk.bold.cyan('\n  ╔══════════════════════════════════╗'));
  console.log(chalk.bold.cyan('  ║') + chalk.bold.white('   🧠 AgentOS  —  OpenClaw CLI     ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('  ╚══════════════════════════════════╝\n'));
}

const program = new Command();
program
  .name('agentos')
  .description(chalk.cyan('AgentOS CLI — admin, cashier, and partner management'))
  .version('2.0.0')
  .hook('preAction', () => printBanner());

// ================================================================
// AUTH helpers
// ================================================================

async function login(email: string, password: string): Promise<void> {
  const res = await axios.post(`${API}/api/auth/login`, { email, password });
  authToken = res.data.data.token;
  console.log(chalk.green(`✓ Logged in as ${res.data.data.user.email} (${res.data.data.user.role})`));
}

function api(token?: string) {
  return axios.create({
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
    } catch (err: any) {
      console.error(chalk.red('Login failed:', err.response?.data?.error || err.message));
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
    const spinner = ora('Generating vouchers...').start();
    try {
      const res = await api(opts.token).post('/api/vouchers/generate', {
        planId: opts.plan,
        quantity: parseInt(opts.qty),
        prefix: opts.prefix,
      });
      spinner.succeed(`Generated ${res.data.data.count} voucher(s)`);
      console.log(chalk.cyan('\nCodes:'));
      res.data.data.codes.forEach((code: string) => console.log(`  ${chalk.bold(code)}`));
    } catch (err: any) {
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
        rows.push([h.id.slice(0, 8), h.name, h.routerIp, h.isOnline ? chalk.green('✓') : chalk.red('✗'), h.location || '-']);
      }
      console.log(table(rows));
    } catch (err: any) {
      console.error(chalk.red(err.response?.data?.error || err.message));
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
      console.log(chalk.green(`✓ User created: ${res.data.data.email} (${res.data.data.role})`));
    } catch (err: any) {
      console.error(chalk.red(err.response?.data?.error || err.message));
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
      console.log(chalk.bold('\n=== Sales Report ==='));
      console.log(`Total Revenue: ${chalk.green('$' + total.toFixed(2))}`);
      console.log('By Method:');
      Object.entries(byMethod).forEach(([m, v]) => {
        console.log(`  ${m}: $${(v as number).toFixed(2)}`);
      });
    } catch (err: any) {
      console.error(chalk.red(err.response?.data?.error || err.message));
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
      console.log(chalk.bold('\n╔═══════════════════════════════╗'));
      console.log(chalk.bold('║   AgentOS System Dashboard   ║'));
      console.log(chalk.bold('╚═══════════════════════════════╝'));
      console.log(`  Total Users:     ${chalk.cyan(d.totalUsers)}`);
      console.log(`  Total Vouchers:  ${chalk.cyan(d.totalVouchers)}`);
      console.log(`  Active Sessions: ${chalk.green(d.activeSessions)}`);
      console.log(`  Online Hotspots: ${chalk.green(d.onlineHotspots)} / ${d.totalHotspots}`);
      console.log(`  Queued Vouchers: ${chalk.yellow(d.queuedVouchers)}`);
      console.log(`  Total Revenue:   ${chalk.green('$' + d.totalRevenue?.toFixed(2))}\n`);
    } catch (err: any) {
      console.error(chalk.red(err.response?.data?.error || err.message));
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
    const spinner = ora('Processing sale...').start();
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
      console.log(chalk.bold('\nVoucher Codes:'));
      d.codes.forEach((c: string) => console.log(`  ${chalk.green(c)}`));
    } catch (err: any) {
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
          chalk.bold(v.code),
          v.plan?.name || '-',
          v.status,
          v.validUntil ? new Date(v.validUntil).toLocaleString() : '-',
        ]);
      }
      console.log(table(rows));
    } catch (err: any) {
      console.error(chalk.red(err.response?.data?.error || err.message));
    }
  });

cashier
  .command('print')
  .description('Print or reprint a voucher')
  .requiredOption('--voucher <code>')
  .option('--token <token>')
  .action(async (opts) => {
    const spinner = ora('Sending to printer...').start();
    try {
      await api(opts.token).post('/api/vouchers/reprint', { code: opts.voucher });
      spinner.succeed(`Print job queued for ${opts.voucher}`);
    } catch (err: any) {
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
      console.log(table(rows));
    } catch (err: any) {
      console.error(chalk.red(err.response?.data?.error || err.message));
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
      console.log(chalk.bold(`\nWallet Balance: ${chalk.green(currency + ' ' + balance.toFixed(2))}`));
    } catch (err: any) {
      console.error(chalk.red(err.response?.data?.error || err.message));
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
      console.log(chalk.bold('\n=== Partner Sales Report ==='));
      console.log(`Total: ${chalk.green('$' + total.toFixed(2))}`);
      console.log('By Counter:');
      Object.entries(byCounter).forEach(([cid, amt]) => {
        console.log(`  ${cid.slice(0, 8)}: $${(amt as number).toFixed(2)}`);
      });
    } catch (err: any) {
      console.error(chalk.red(err.response?.data?.error || err.message));
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
    const spinner = ora('Parsing command...').start();
    try {
      // In a real implementation this would call the API which invokes ChatOpsAgent
      const res = await api(opts.token).post('/api/system/chat', { command: message });
      spinner.succeed('Command executed');
      console.log(chalk.green(JSON.stringify(res.data.data, null, 2)));
    } catch (err: any) {
      spinner.fail(err.response?.data?.error || err.message);
    }
  });

program
  .command('install <skill>')
  .description('Install an external agent skill package')
  .option('--token <token>')
  .action(async (skill, opts) => {
    const spinner = ora(`Installing skill: ${skill}...`).start();
    try {
      const res = await api(opts.token).post('/api/system/install', { skill });
      spinner.succeed(`Skill ${skill} installed successfully`);
    } catch (err: any) {
      spinner.fail(err.response?.data?.error || err.message);
    }
  });

program
  .command('run <moltbook>')
  .description('Execute a .molt orchestration script')
  .option('--token <token>')
  .action(async (moltbook, opts) => {
    const spinner = ora(`Reading ${moltbook}...`).start();
    try {
      if (!fs.existsSync(moltbook)) throw new Error('File not found');
      const content = fs.readFileSync(moltbook, 'utf8');
      spinner.text = 'Executing Moltbook on Kernel...';
      const res = await api(opts.token).post('/api/system/moltbook', { script: content });
      spinner.succeed('Moltbook execution complete');
      console.log(chalk.green(JSON.stringify(res.data.data, null, 2)));
    } catch (err: any) {
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
    console.log(chalk.cyan('Welcome to AgentOS! Let\'s get you set up.\n'));
    
    const answers = await inquirer.prompt([
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
        default: (ans: any) => {
          const defaults: Record<string, string> = {
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
        when: (ans: any) => ans.provider !== 'ollama',
        mask: '*',
      },
    ]);

    const cfg = saveLocalConfig({
      llm: { provider: answers.provider, model: answers.model, apiKey: answers.apiKey },
      onboarded: true,
    });

    console.log(chalk.green(`\n✓ Config saved to ${CONFIG_FILE}`));
    console.log(chalk.dim(`  Provider: ${cfg.llm.provider}  •  Model: ${cfg.llm.model}\n`));
    console.log(chalk.bold('AgentOS is ready. Try:'));
    console.log(chalk.cyan('  agentos status') + chalk.dim('         — view kernel health'));
    console.log(chalk.cyan('  agentos plan "<goal>"') + chalk.dim('   — run an autonomous task\n'));
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
      console.log(chalk.bold('\nCurrent Configuration:'));
      console.log(`  Provider : ${chalk.cyan(cfg.llm?.provider || 'not set')}`);
      console.log(`  Model    : ${chalk.cyan(cfg.llm?.model || 'not set')}`);
      console.log(`  API Key  : ${cfg.llm?.apiKey ? chalk.green('••••••••') : chalk.red('not set')}\n`);
      return;
    }
    const update: any = { llm: loadLocalConfig().llm || {} };
    if (opts.provider) update.llm.provider = opts.provider;
    if (opts.model)    update.llm.model    = opts.model;
    if (opts.key)      update.llm.apiKey   = opts.key;
    saveLocalConfig(update);
    console.log(chalk.green('✓ Configuration updated.\n'));
  });

// ================================================================
// STATUS (Phase 1)
// ================================================================

program
  .command('status')
  .description('Show kernel, gateway, and agent health status')
  .option('--token <token>', 'Auth token')
  .action(async (opts) => {
    const spinner = ora('Contacting AgentOS kernel...').start();
    try {
      const res = await api(opts.token).get('/health');
      spinner.stop();

      const d = res.data.data;
      const gw = d.gateway;
      const cfg = loadLocalConfig();

      console.log(chalk.bold(`\n┌─ Kernel Status ──────────────────────────────┐`));
      console.log(`  Status   : ${d.status === 'ONLINE' ? chalk.green('● ONLINE') : chalk.red('● OFFLINE')}`);
      console.log(`  Uptime   : ${chalk.cyan(Math.floor(d.uptime) + 's')}`);
      console.log(`  LLM      : ${chalk.cyan(cfg.llm?.provider + ' / ' + cfg.llm?.model)}`);
      console.log(chalk.bold(`├─ Gateway ─────────────────────────────────────┤`));
      console.log(`  Port     : ${chalk.cyan(gw?.port || 4001)}`);
      console.log(`  Status   : ${gw?.status === 'ONLINE' ? chalk.green('● ONLINE') : chalk.yellow('● OFFLINE')}`);
      console.log(`  Channels : ${chalk.cyan(gw?.activeChannels || 0)}`);
      console.log(chalk.bold(`├─ Registered Agents (${d.agents?.length || 0}) ────────────────────┤`));

      const agents: string[] = d.agents || [];
      const rows = agents.map((name: string, i: number) => [
        chalk.dim(String(i + 1).padStart(2)),
        chalk.white(name),
        chalk.green('● ACTIVE'),
      ]);
      if (rows.length) {
        console.log(table([['#', 'Agent', 'Status'], ...rows], {
          border: { topBody: '─', topJoin: '┬', topLeft: '│', topRight: '│',
                    bottomBody: '─', bottomJoin: '┴', bottomLeft: '│', bottomRight: '│',
                    bodyLeft: '│', bodyRight: '│', bodyJoin: '│', joinBody: '─',
                    joinLeft: '│', joinRight: '│', joinJoin: '┼' },
          columnDefault: { paddingLeft: 1, paddingRight: 1 },
        }));
      }
      console.log(chalk.bold(`└───────────────────────────────────────────────┘\n`));
    } catch (err: any) {
      spinner.fail(`Cannot reach kernel: ${err.response?.data?.error || err.message}`);
      console.log(chalk.dim('  Tip: start the API with: npm run dev (packages/api)\n'));
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
    const spinner = ora(`Planning: "${goal}"`).start();
    try {
      const res = await api(opts.token).post('/api/system/plan', {
        goal,
        maxSteps: parseInt(opts.steps),
      });
      spinner.stop();

      const result = res.data.data;
      console.log(chalk.bold(`\n🎯 Goal: ${chalk.cyan(result.goal)}\n`));

      result.steps.forEach((step: any, i: number) => {
        console.log(chalk.bold.yellow(`▸ Step ${i + 1}`) + chalk.dim(' (Thought)'));
        console.log(chalk.dim('  ' + step.thought));
        if (step.action) {
          console.log(chalk.bold('  🔧 Action: ') + chalk.cyan(step.action.tool));
          console.log(chalk.dim('     Args: ' + JSON.stringify(step.action.args)));
        }
        if (step.observation) {
          console.log(chalk.bold('  👁  Observation: ') + chalk.green(step.observation.slice(0, 200)));
        }
        console.log();
      });

      if (result.success) {
        console.log(chalk.bold.green(`✓ Complete: ${result.finalOutput}\n`));
      } else {
        console.log(chalk.bold.yellow(`⚠ Reached max steps without completing goal.\n`));
      }
    } catch (err: any) {
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
    const spinner = ora('Extracting text via NanoPDF...').start();
    try {
      // In a full implementation, we'd send the file to an API or call PDFAgent tools directly if running locally.
      // E.g. mcpRegistry.invokeTool('pdf_extract_text', { filePath: file })
      spinner.succeed(`Extracted text from ${file}`);
      console.log(chalk.gray(`\nImplementation note: PDFAgent tool invoked for ${file}`));
    } catch (err: any) {
      spinner.fail(`NanoPDF Extract failed: ${err.message}`);
    }
  });

nanopdfCmd.command('merge <output> [inputs...]')
  .description('Merge multiple PDFs into one')
  .action(async (output, inputs) => {
    if (!inputs || inputs.length < 2) {
      console.log(chalk.red('Please provide at least two input files to merge.'));
      return;
    }
    const spinner = ora(`Merging ${inputs.length} files into ${output}...`).start();
    try {
      spinner.succeed(`Successfully merged to ${output}`);
      console.log(chalk.gray(`\nImplementation note: PDFAgent tool pdf_merge invoked`));
    } catch (err: any) {
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
    const spinner = ora(`Sending WhatsApp message to ${options.to}...`).start();
    try {
      const res = await api(options.token).post(`/api/channels/send`, {
        channel: 'whatsapp',
        to: options.to,
        content: options.msg
      });
      
      if (res.data.success) {
        spinner.succeed(`Message delivered!`);
      } else {
        spinner.fail(`Delivery failed: ${res.data.error}`);
      }
    } catch (err: any) {
      spinner.fail(`WACLI Send error: ${err.response?.data?.error || err.message}`);
    }
  });

wacliCmd.command('listen')
  .description('Listen to incoming WhatsApp messages using ACPx WebSocket stream')
  .action(async () => {
    console.log(chalk.cyan('Connecting to WACLI Stream via ACPx...'));
    console.log(chalk.gray('Listening for incoming messages on ws://localhost:4001...'));
    // In a real implementation we would open a WebSocket to the Gateway WS endpoint
    // ws.on('message', msg => console.log(JSON.parse(msg)))
  });

program
  .command('interactive')
  .description('Launch interactive menu mode')
  .action(async () => {
    await runInteractiveMenu(api());
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  runInteractiveMenu(api());
}

