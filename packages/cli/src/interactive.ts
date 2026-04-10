import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.agentos');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')); } catch {}
  }
  return { llm: { provider: 'openai', model: 'gpt-4o' } };
}

function saveConfig(updates: any) {
  const current = loadConfig();
  const merged = { ...current, ...updates };
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
}

export async function runInteractiveMenu(api: AxiosInstance) {
  console.clear();
  console.log(chalk.bold.cyan('\n  ╔══════════════════════════════════╗'));
  console.log(chalk.bold.cyan('  ║') + chalk.bold.white('   🧠 AgentOS Interactive Mode     ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('  ╚══════════════════════════════════╝\n'));

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Main Menu:',
        choices: [
          { name: '📂 Navigate System Data', value: 'nav' },
          { name: '⚙️  Customize Settings', value: 'config' },
          { name: '🧪 Testing & Sandbox', value: 'test' },
          { name: '🏥 Health Check', value: 'status' },
          new inquirer.Separator(),
          { name: '❌ Exit', value: 'exit' },
        ],
      },
    ]);

    if (action === 'exit') break;

    try {
      switch (action) {
        case 'nav': await handleNavigation(api); break;
        case 'config': await handleCustomization(); break;
        case 'test': await handleTesting(api); break;
        case 'status': await handleStatus(api); break;
      }
    } catch (err: any) {
      console.log(chalk.red(`\nError: ${err.response?.data?.error || err.message}\n`));
    }
  }
}

async function handleNavigation(api: AxiosInstance) {
  const { category } = await inquirer.prompt([
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

  if (category === 'back') return;

  const spinner = ora(`Fetching ${category}...`).start();
  try {
    if (category === 'hotspots') {
      const res = await api.get('/api/hotspots');
      spinner.stop();
      const rows = [['ID', 'Name', 'IP', 'Status', 'Location']];
      res.data.data.forEach((h: any) => rows.push([h.id.slice(0,8), h.name, h.routerIp, h.isOnline ? chalk.green('ONLINE') : chalk.red('OFFLINE'), h.location || '-']));
      console.log('\n' + table(rows));
    } else if (category === 'vouchers') {
      const res = await api.get('/api/vouchers');
      spinner.stop();
      const rows = [['Code', 'Plan', 'Status', 'Expires']];
      res.data.data.items.slice(0, 15).forEach((v: any) => rows.push([chalk.bold(v.code), v.plan?.name || '-', v.status, v.validUntil ? new Date(v.validUntil).toLocaleDateString() : '-']));
      console.log('\n' + table(rows));
    } else if (category === 'users') {
      const res = await api.get('/api/admin/users');
      spinner.stop();
      const rows = [['Email', 'Role', 'Status']];
      res.data.data.forEach((u: any) => rows.push([u.email, u.role, chalk.green('ACTIVE')]));
      console.log('\n' + table(rows));
    } else if (category === 'dashboard') {
      const res = await api.get('/api/admin/dashboard');
      spinner.stop();
      const d = res.data.data;
      console.log(chalk.bold('\n--- Overview ---'));
      console.log(`  Users:    ${d.totalUsers}`);
      console.log(`  Vouchers: ${d.totalVouchers}`);
      console.log(`  Revenue:  $${d.totalRevenue.toFixed(2)}`);
    }
  } finally {
    spinner.stop();
  }
}

async function handleCustomization() {
  const cfg = loadConfig();
  const answers = await inquirer.prompt([
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
      default: (ans: any) => {
        const d: any = { openai: 'gpt-4o', anthropic: 'claude-3-5-sonnet-20241022', google: 'gemini-2.0-flash', ollama: 'llama3.2' };
        return d[ans.provider] || 'gpt-4o';
      },
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter API Key (leave blank to keep current):',
      when: (ans: any) => ans.provider !== 'ollama',
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
  console.log(chalk.green('\n✓ Configuration saved.\n'));
}

async function handleTesting(api: AxiosInstance) {
  const { tool } = await inquirer.prompt([
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

  if (tool === 'back') return;

  if (tool === 'plan') {
    const { goal } = await inquirer.prompt([{ type: 'input', name: 'goal', message: 'Enter goal for the agent:' }]);
    const spinner = ora('Planning...').start();
    const res = await api.post('/api/system/plan', { goal });
    spinner.succeed('Goal handled.');
    console.log(chalk.cyan(res.data.data.finalOutput));
  } else if (tool === 'chat') {
    const { msg } = await inquirer.prompt([{ type: 'input', name: 'msg', message: 'Chat:' }]);
    const res = await api.post('/api/system/chat', { command: msg });
    console.log(chalk.green('\nResponse:'), res.data.data);
  } else if (tool === 'whatsapp') {
    const { to, msg } = await inquirer.prompt([
      { type: 'input', name: 'to', message: 'Recipient number:' },
      { type: 'input', name: 'msg', message: 'Message:' },
    ]);
    const res = await api.post('/api/channels/send', { channel: 'whatsapp', to, content: msg });
    console.log(res.data.success ? chalk.green('Sent!') : chalk.red('Failed.'));
  }
}

async function handleStatus(api: AxiosInstance) {
  const spinner = ora('Checking health...').start();
  try {
    const res = await api.get('/health');
    spinner.stop();
    const d = res.data.data;
    console.log(`\n  Kernel:  ${d.status === 'ONLINE' ? chalk.green('● ONLINE') : chalk.red('● ERROR')}`);
    console.log(`  Gateway: ${d.gateway.status === 'ONLINE' ? chalk.green('● ONLINE') : chalk.yellow('● WARNING')}`);
    console.log(`  Agents:  ${d.agents.length} active\n`);
  } catch {
    spinner.fail('Kernel unreachable. Ensure "npm run dev" is running in packages/api.');
  }
}
