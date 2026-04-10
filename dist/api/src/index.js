"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const kernel_1 = require("@agentclaw/kernel");
const agents_1 = require("@agentclaw/agents");
const auth_1 = require("./routes/auth");
const vouchers_1 = require("./routes/vouchers");
const hotspots_1 = require("./routes/hotspots");
const payments_1 = require("./routes/payments");
const plans_1 = require("./routes/plans");
const pos_1 = require("./routes/pos");
const partner_1 = require("./routes/partner");
const webhooks_1 = require("./routes/webhooks");
const admin_1 = require("./routes/admin");
const channels_1 = require("./routes/channels");
const notifications_1 = require("./routes/notifications");
exports.app = (0, express_1.default)();
// ---- Middleware ----
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting
exports.app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
}));
// Request logger
exports.app.use((req, _res, next) => {
    kernel_1.logger.debug(`${req.method} ${req.path}`);
    next();
});
// ---- Routes ----
exports.app.use('/api/auth', auth_1.authRouter);
exports.app.use('/api/vouchers', vouchers_1.voucherRouter);
exports.app.use('/api/hotspots', hotspots_1.hotspotRouter);
exports.app.use('/api/payments', payments_1.paymentRouter);
exports.app.use('/api/admin', admin_1.adminRouter);
exports.app.use('/api/channels', channels_1.channelsRouter);
exports.app.use('/api/plans', plans_1.plansRouter);
exports.app.use('/api/pos', pos_1.posRouter);
exports.app.use('/api/partner', partner_1.partnerRouter);
exports.app.use('/api/webhooks', webhooks_1.webhooksRouter);
exports.app.use('/api/notifications', notifications_1.notificationRouter);
// Health check
exports.app.get('/health', (_req, res) => {
    const { gateway } = require('./Gateway');
    return res.json({
        success: true,
        data: {
            status: 'ONLINE',
            uptime: process.uptime(),
            agents: Object.keys(exports.app.locals.agents || {}),
            mcpToolCount: kernel_1.mcpRegistry.getToolDefinitions().length,
            mcpTools: kernel_1.mcpRegistry.getToolDefinitions().map(t => t.name),
            gateway: gateway.getStats(),
            timestamp: new Date().toISOString(),
        }
    });
});
// /api/system/plan — Autonomous goal execution via PlanningEngine
exports.app.post('/api/system/plan', async (req, res) => {
    const { goal, maxSteps } = req.body;
    if (!goal)
        return res.status(400).json({ success: false, error: 'goal is required' });
    try {
        const result = await kernel_1.planningEngine.runAutonomousLoop(goal, maxSteps || 6);
        return res.json({ success: true, data: result });
    }
    catch (err) {
        kernel_1.logger.error(`/api/system/plan error: ${err.message}`);
        return res.status(500).json({ success: false, error: err.message });
    }
});
// /api/system/chat — Natural language command via ChatOpsAgent
exports.app.post('/api/system/chat', async (req, res) => {
    const { command } = req.body;
    if (!command)
        return res.status(400).json({ success: false, error: 'command is required' });
    try {
        const agent = exports.app.locals.agents?.chatOps;
        if (agent && typeof agent.process === 'function') {
            const result = await agent.process(command);
            return res.json({ success: true, data: { result } });
        }
        return res.json({ success: true, data: { result: 'ChatOps processed: ' + command } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
// /api/system/install — Install external skill
exports.app.post('/api/system/install', (req, res) => {
    const { skill } = req.body;
    if (!skill)
        return res.status(400).json({ success: false, error: 'skill is required' });
    // Placeholder — actual skill loader will be wired in future iteration
    kernel_1.logger.info(`/api/system/install: requested skill '${skill}'`);
    return res.json({ success: true, data: { message: `Skill '${skill}' queued for installation.` } });
});
// /api/system/moltbook — Execute a Moltbook script
exports.app.post('/api/system/moltbook', (req, res) => {
    const { script } = req.body;
    if (!script)
        return res.status(400).json({ success: false, error: 'script is required' });
    kernel_1.logger.info(`/api/system/moltbook: received script (${script.length} chars)`);
    return res.json({ success: true, data: { message: 'Moltbook queued for execution.', lines: script.split('\n').length } });
});
// ---- Error Handler ----
const error_1 = require("./middleware/error");
exports.app.use(error_1.notFoundMiddleware);
exports.app.use(error_1.errorMiddleware);
// ---- Bootstrap ----
async function bootstrap() {
    // Register all agents
    const voucherAgent = new agents_1.VoucherAgent();
    const hotspotAgent = new agents_1.HotspotAgent();
    const paymentAgent = new agents_1.PaymentAgent();
    const printerAgent = new agents_1.PrinterAgent();
    const notifierAgent = new agents_1.NotifierAgent();
    const predictiveAgent = new agents_1.PredictiveAgent();
    const roamingAgent = new agents_1.RoamingAgent();
    const interfaceAgent = new agents_1.InterfaceAgent();
    const routingAgent = new agents_1.RoutingAgent();
    const firewallAgent = new agents_1.FirewallAgent();
    const dhcpAgent = new agents_1.DHCPAgent();
    const trafficAgent = new agents_1.TrafficAgent();
    const deviceAgent = new agents_1.DeviceAgent();
    const planAgent = new agents_1.PlanAgent();
    const sessionAgent = new agents_1.SessionAgent();
    const radiusAgent = new agents_1.RadiusAgent();
    const partnerAgent = new agents_1.PartnerAgent();
    const monitorAgent = new agents_1.MonitorAgent();
    const optimizationAgent = new agents_1.OptimizationAgent();
    const securityAgent = new agents_1.SecurityAgent();
    const growthAgent = new agents_1.GrowthAgent();
    const chatOpsAgent = new agents_1.ChatOpsAgent();
    const cliAgent = new agents_1.CLIAgent();
    const pdfAgent = new agents_1.PDFAgent('pdf', 'PDFAgent', 'PDF document manipulation');
    const githubAgent = new agents_1.GitHubAgent('github', 'GitHubAgent', 'GitHub repository integration');
    // Register all agents
    kernel_1.agentRegistry.register(voucherAgent);
    kernel_1.agentRegistry.register(hotspotAgent);
    kernel_1.agentRegistry.register(paymentAgent);
    kernel_1.agentRegistry.register(printerAgent);
    kernel_1.agentRegistry.register(notifierAgent);
    kernel_1.agentRegistry.register(predictiveAgent);
    kernel_1.agentRegistry.register(roamingAgent);
    kernel_1.agentRegistry.register(interfaceAgent);
    kernel_1.agentRegistry.register(routingAgent);
    kernel_1.agentRegistry.register(firewallAgent);
    kernel_1.agentRegistry.register(dhcpAgent);
    kernel_1.agentRegistry.register(trafficAgent);
    kernel_1.agentRegistry.register(deviceAgent);
    kernel_1.agentRegistry.register(planAgent);
    kernel_1.agentRegistry.register(sessionAgent);
    kernel_1.agentRegistry.register(radiusAgent);
    kernel_1.agentRegistry.register(partnerAgent);
    kernel_1.agentRegistry.register(monitorAgent);
    kernel_1.agentRegistry.register(optimizationAgent);
    kernel_1.agentRegistry.register(securityAgent);
    kernel_1.agentRegistry.register(growthAgent);
    kernel_1.agentRegistry.register(chatOpsAgent);
    kernel_1.agentRegistry.register(cliAgent);
    kernel_1.agentRegistry.register(pdfAgent);
    kernel_1.agentRegistry.register(githubAgent);
    // Init skill agents (they register MCP tools on init)
    await pdfAgent.init();
    await githubAgent.init();
    // Make agents accessible to routes via app.locals
    exports.app.locals.agents = {
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
    await kernel_1.kernel.boot();
    // Start Gateway daemon (WebSocket control plane)
    const { gateway } = require('./Gateway');
    await gateway.start();
    // Start HTTP server
    exports.app.listen(kernel_1.config.api.port, () => {
        kernel_1.logger.info(`AgentOS API running on http://localhost:${kernel_1.config.api.port}`);
    });
}
bootstrap().catch((err) => {
    kernel_1.logger.error(`Bootstrap failed: ${err.message}`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map