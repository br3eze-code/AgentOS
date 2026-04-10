"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kernel = exports.Kernel = void 0;
const AgentRegistry_1 = require("./AgentRegistry");
const MemoryManager_1 = require("./MemoryManager");
const Database_1 = require("./Database"); // Keep getFirestore as it's not in the new index import
const EdgeSyncManager_1 = require("./EdgeSyncManager");
const index_1 = require("./index");
/**
 * AgentOS Kernel — the heart of the system.
 * Boots all subsystems in order: DB → Redis → Agents
 * Provides graceful shutdown on process signals.
 */
class Kernel {
    static instance;
    booted = false;
    heartbeatInterval;
    status = 'IDLE'; // Add status property
    constructor() { }
    static getInstance() {
        if (!Kernel.instance) {
            Kernel.instance = new Kernel();
        }
        return Kernel.instance;
    }
    /**
     * Boot the kernel.
     * Agents must be registered BEFORE calling boot().
     */
    async boot() {
        if (this.booted) {
            index_1.logger.warn('Kernel already booted');
            return;
        }
        this.status = 'BOOTING'; // Set status to booting
        index_1.logger.info('╔════════════════════════════════════╗');
        index_1.logger.info('║      AgentOS Kernel Starting     ║');
        index_1.logger.info('╚════════════════════════════════════╝');
        index_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        index_1.logger.info(`API Port: ${index_1.config.api.port}`);
        // 1. Connect to database
        index_1.logger.info('[1/7] Connecting to database...');
        await (0, index_1.connectDB)();
        // 2. Connect to Redis
        index_1.logger.info('[2/7] Connecting to Redis (MemoryManager)...');
        await MemoryManager_1.memoryManager.connect();
        // 3. Start Edge Sync Manager
        index_1.logger.info('[3/7] Starting EdgeSyncManager...');
        await EdgeSyncManager_1.edgeSyncManager.start();
        // 4. Load external skills
        index_1.logger.info('[4/7] Loading external skills...');
        const { skillLoader } = require('./SkillLoader');
        await skillLoader.loadSkills(index_1.config.skills.dir);
        // 5. Initialize ToolOrchestrator and PlanningEngine
        index_1.logger.info('[5/7] Initializing ToolOrchestrator and PlanningEngine...');
        await index_1.toolOrchestrator.init();
        await index_1.planningEngine.init();
        // 6. Start all registered agents (internal + external)
        index_1.logger.info('[6/7] Starting agents...');
        await AgentRegistry_1.agentRegistry.startAll();
        // 7. Setup wildcard event audit logger
        index_1.eventBus.on('*', (event) => {
            index_1.logger.debug(`[EventBus] ${event.type} from ${event.source}`);
        });
        this.booted = true;
        this.status = 'RUNNING'; // Set status to running
        // 8. Start Heartbeat (Firestore update every 1 minute)
        this.startHeartbeat();
        index_1.logger.info('✓ AgentOS Kernel is running');
        index_1.logger.info(`Agents: ${JSON.stringify(AgentRegistry_1.agentRegistry.getStatus())}`);
        // Graceful shutdown
        this.setupShutdownHandlers();
    }
    /**
     * Shutdown the kernel gracefully.
     */
    async shutdown() {
        if (this.status === 'SHUTTING_DOWN') {
            index_1.logger.warn('Kernel already shutting down.');
            return;
        }
        this.status = 'SHUTTING_DOWN'; // Set status to shutting down
        index_1.logger.info('Kernel shutting down...');
        await AgentRegistry_1.agentRegistry.stopAll();
        await EdgeSyncManager_1.edgeSyncManager.stop();
        await MemoryManager_1.memoryManager.disconnect();
        await (0, index_1.disconnectDB)();
        this.stopHeartbeat();
        index_1.cronManager.stopAll();
        index_1.logger.info('Kernel shutdown complete. Goodbye.');
        process.exit(0);
    }
    setupShutdownHandlers() {
        const shutdown = async () => {
            await this.shutdown();
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        process.on('uncaughtException', (err) => {
            index_1.logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
            shutdown();
        });
        process.on('unhandledRejection', (reason) => {
            index_1.logger.error(`Unhandled rejection: ${reason}`);
        });
    }
    get isBooted() {
        return this.booted;
    }
    startHeartbeat() {
        index_1.logger.info('Kernel: Starting 1-minute heartbeat...');
        this.heartbeatInterval = setInterval(async () => {
            try {
                const db = (0, Database_1.getFirestore)();
                await db.collection('status').doc('kernel').set({
                    status: this.status, // Use the new status property
                    lastSeen: new Date(),
                    version: '1.0.0',
                    agents: AgentRegistry_1.agentRegistry.getStatus(),
                }, { merge: true });
                index_1.logger.debug('Kernel: Heartbeat updated.');
            }
            catch (err) {
                index_1.logger.error(`Kernel: Heartbeat failed: ${err.message}`);
            }
        }, 60 * 1000);
    }
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            index_1.logger.info('Kernel: Heartbeat stopped.');
        }
    }
}
exports.Kernel = Kernel;
exports.kernel = Kernel.getInstance();
//# sourceMappingURL=Kernel.js.map