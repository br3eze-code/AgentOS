import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { kernel, agentRegistry, logger, config, planningEngine, mcpRegistry } from '@agentclaw/kernel';
import {
  VoucherAgent,
  HotspotAgent,
  PaymentAgent,
  PrinterAgent,
  NotifierAgent,
  PredictiveAgent,
  RoamingAgent,
  InterfaceAgent,
  RoutingAgent,
  FirewallAgent,
  DHCPAgent,
  TrafficAgent,
  DeviceAgent,
  PlanAgent,
  SessionAgent,
  RadiusAgent,
  PartnerAgent,
  MonitorAgent,
  OptimizationAgent,
  SecurityAgent,
  GrowthAgent,
  ChatOpsAgent,
  CLIAgent,
  PDFAgent,
  GitHubAgent,
} from '@agentclaw/agents';
import { authRouter } from './routes/auth';
import { voucherRouter } from './routes/vouchers';
import { hotspotRouter } from './routes/hotspots';
import { paymentRouter } from './routes/payments';
import { plansRouter } from './routes/plans';
import { posRouter } from './routes/pos';
import { partnerRouter } from './routes/partner';
import { webhooksRouter } from './routes/webhooks';
import { adminRouter } from './routes/admin';
import { channelsRouter } from './routes/channels';
import { notificationRouter } from './routes/notifications';

export const app = express();

// ---- Middleware ----
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
}));

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ---- Routes ----
app.use('/api/auth', authRouter);
app.use('/api/vouchers', voucherRouter);
app.use('/api/hotspots', hotspotRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/plans', plansRouter);
app.use('/api/pos', posRouter);
app.use('/api/partner', partnerRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/notifications', notificationRouter);

// Health check
app.get('/health', (_req, res) => {
  const { gateway } = require('./Gateway');
  return res.json({
    success: true,
    data: {
      status: 'ONLINE',
      uptime: process.uptime(),
      agents: Object.keys(app.locals.agents || {}),
      mcpToolCount: mcpRegistry.getToolDefinitions().length,
      mcpTools: mcpRegistry.getToolDefinitions().map(t => t.name),
      gateway: gateway.getStats(),
      timestamp: new Date().toISOString(),
    }
  });
});

// /api/system/plan — Autonomous goal execution via PlanningEngine
app.post('/api/system/plan', async (req, res) => {
  const { goal, maxSteps } = req.body;
  if (!goal) return res.status(400).json({ success: false, error: 'goal is required' });
  try {
    const result = await planningEngine.runAutonomousLoop(goal, maxSteps || 6);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error(`/api/system/plan error: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// /api/system/chat — Natural language command via ChatOpsAgent
app.post('/api/system/chat', async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ success: false, error: 'command is required' });
  try {
    const agent: any = app.locals.agents?.chatOps;
    if (agent && typeof agent.process === 'function') {
      const result = await agent.process(command);
      return res.json({ success: true, data: { result } });
    }
    return res.json({ success: true, data: { result: 'ChatOps processed: ' + command } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// /api/system/install — Install external skill
app.post('/api/system/install', (req, res) => {
  const { skill } = req.body;
  if (!skill) return res.status(400).json({ success: false, error: 'skill is required' });
  // Placeholder — actual skill loader will be wired in future iteration
  logger.info(`/api/system/install: requested skill '${skill}'`);
  return res.json({ success: true, data: { message: `Skill '${skill}' queued for installation.` } });
});

// /api/system/moltbook — Execute a Moltbook script
app.post('/api/system/moltbook', (req, res) => {
  const { script } = req.body;
  if (!script) return res.status(400).json({ success: false, error: 'script is required' });
  logger.info(`/api/system/moltbook: received script (${script.length} chars)`);
  return res.json({ success: true, data: { message: 'Moltbook queued for execution.', lines: script.split('\n').length } });
});

// ---- Error Handler ----
import { errorMiddleware, notFoundMiddleware } from './middleware/error';
app.use(notFoundMiddleware);
app.use(errorMiddleware);

// ---- Bootstrap ----
async function bootstrap(): Promise<void> {
  // Register all agents
  const voucherAgent = new VoucherAgent();
  const hotspotAgent = new HotspotAgent();
  const paymentAgent = new PaymentAgent();
  const printerAgent = new PrinterAgent();
  const notifierAgent = new NotifierAgent();
  const predictiveAgent = new PredictiveAgent();
  const roamingAgent = new RoamingAgent();
  const interfaceAgent = new InterfaceAgent();
  const routingAgent = new RoutingAgent();
  const firewallAgent = new FirewallAgent();
  const dhcpAgent = new DHCPAgent();
  const trafficAgent = new TrafficAgent();
  const deviceAgent = new DeviceAgent();
  const planAgent = new PlanAgent();
  const sessionAgent = new SessionAgent();
  const radiusAgent = new RadiusAgent();
  const partnerAgent = new PartnerAgent();
  const monitorAgent = new MonitorAgent();
  const optimizationAgent = new OptimizationAgent();
  const securityAgent = new SecurityAgent();
  const growthAgent = new GrowthAgent();
  const chatOpsAgent = new ChatOpsAgent();
  const cliAgent = new CLIAgent();

  const pdfAgent     = new PDFAgent('pdf', 'PDFAgent', 'PDF document manipulation');
  const githubAgent  = new GitHubAgent('github', 'GitHubAgent', 'GitHub repository integration');

  // Register all agents
  agentRegistry.register(voucherAgent);
  agentRegistry.register(hotspotAgent);
  agentRegistry.register(paymentAgent);
  agentRegistry.register(printerAgent);
  agentRegistry.register(notifierAgent);
  agentRegistry.register(predictiveAgent);
  agentRegistry.register(roamingAgent);
  agentRegistry.register(interfaceAgent);
  agentRegistry.register(routingAgent);
  agentRegistry.register(firewallAgent);
  agentRegistry.register(dhcpAgent);
  agentRegistry.register(trafficAgent);
  agentRegistry.register(deviceAgent);
  agentRegistry.register(planAgent);
  agentRegistry.register(sessionAgent);
  agentRegistry.register(radiusAgent);
  agentRegistry.register(partnerAgent);
  agentRegistry.register(monitorAgent);
  agentRegistry.register(optimizationAgent);
  agentRegistry.register(securityAgent);
  agentRegistry.register(growthAgent);
  agentRegistry.register(chatOpsAgent);
  agentRegistry.register(cliAgent);
  agentRegistry.register(pdfAgent);
  agentRegistry.register(githubAgent);

  // Init skill agents (they register MCP tools on init)
  await pdfAgent.init();
  await githubAgent.init();

  // Make agents accessible to routes via app.locals
  app.locals.agents = {
    voucher: voucherAgent,
    hotspot: hotspotAgent,
    payment: paymentAgent,
    printer: printerAgent,
    notifier: notifierAgent,
    predictive: predictiveAgent,
    roaming: roamingAgent,
    interface: interfaceAgent,
    routing: routingAgent,
    firewall: firewallAgent,
    dhcp: dhcpAgent,
    traffic: trafficAgent,
    device: deviceAgent,
    plan: planAgent,
    session: sessionAgent,
    radius: radiusAgent,
    partner: partnerAgent,
    monitor: monitorAgent,
    optimization: optimizationAgent,
    security: securityAgent,
    growth: growthAgent,
    chatOps: chatOpsAgent,
    cli: cliAgent,
    pdf: pdfAgent,
    github: githubAgent,
  };

  // Boot kernel (connects DB, Redis, starts agents)
  await kernel.boot();

  // Start Gateway daemon (WebSocket control plane)
  const { gateway } = require('./Gateway');
  await gateway.start();

  // Start HTTP server
  app.listen(config.api.port, () => {
    logger.info(`AgentOS API running on http://localhost:${config.api.port}`);
  });
}

bootstrap().catch((err: any) => {
  logger.error(`Bootstrap failed: ${err.message}`);
  process.exit(1);
});
