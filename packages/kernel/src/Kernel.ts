import { agentRegistry } from './AgentRegistry';
import { memoryManager } from './MemoryManager';
import { getFirestore } from './Database'; // Keep getFirestore as it's not in the new index import
import { edgeSyncManager } from './EdgeSyncManager';
import { logger, connectDB, disconnectDB, eventBus, config, cronManager, toolOrchestrator, planningEngine } from './index';

/**
 * AgentOS Kernel — the heart of the system.
 * Boots all subsystems in order: DB → Redis → Agents
 * Provides graceful shutdown on process signals.
 */
export class Kernel {
  private static instance: Kernel;
  private booted = false;
  private heartbeatInterval?: NodeJS.Timeout;
  private status: 'IDLE' | 'BOOTING' | 'RUNNING' | 'SHUTTING_DOWN' = 'IDLE'; // Add status property

  private constructor() { }

  static getInstance(): Kernel {
    if (!Kernel.instance) {
      Kernel.instance = new Kernel();
    }
    return Kernel.instance;
  }

  /**
   * Boot the kernel.
   * Agents must be registered BEFORE calling boot().
   */
  async boot(): Promise<void> {
    if (this.booted) {
      logger.warn('Kernel already booted');
      return;
    }

    this.status = 'BOOTING'; // Set status to booting

    logger.info('╔════════════════════════════════════╗');
    logger.info('║      AgentOS Kernel Starting     ║');
    logger.info('╚════════════════════════════════════╝');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Port: ${config.api.port}`);

    // 1. Connect to database
    logger.info('[1/7] Connecting to database...');
    await connectDB();

    // 2. Connect to Redis
    logger.info('[2/7] Connecting to Redis (MemoryManager)...');
    await memoryManager.connect();

    // 3. Start Edge Sync Manager
    logger.info('[3/7] Starting EdgeSyncManager...');
    await edgeSyncManager.start();

    // 4. Load external skills
    logger.info('[4/7] Loading external skills...');
    const { skillLoader } = require('./SkillLoader');
    await skillLoader.loadSkills(config.skills.dir);

    // 5. Initialize ToolOrchestrator and PlanningEngine
    logger.info('[5/7] Initializing ToolOrchestrator and PlanningEngine...');
    await toolOrchestrator.init();
    await planningEngine.init();

    // 6. Start all registered agents (internal + external)
    logger.info('[6/7] Starting agents...');
    await agentRegistry.startAll();

    // 7. Setup wildcard event audit logger
    eventBus.on('*', (event) => {
      logger.debug(`[EventBus] ${event.type} from ${event.source}`);
    });

    this.booted = true;
    this.status = 'RUNNING'; // Set status to running

    // 8. Start Heartbeat (Firestore update every 1 minute)
    this.startHeartbeat();

    logger.info('✓ AgentOS Kernel is running');
    logger.info(`Agents: ${JSON.stringify(agentRegistry.getStatus())}`);

    // Graceful shutdown
    this.setupShutdownHandlers();
  }

  /**
   * Shutdown the kernel gracefully.
   */
  async shutdown(): Promise<void> {
    if (this.status === 'SHUTTING_DOWN') {
      logger.warn('Kernel already shutting down.');
      return;
    }
    this.status = 'SHUTTING_DOWN'; // Set status to shutting down

    logger.info('Kernel shutting down...');
    await agentRegistry.stopAll();
    await edgeSyncManager.stop();
    await memoryManager.disconnect();
    await disconnectDB();
    this.stopHeartbeat();
    cronManager.stopAll();
    logger.info('Kernel shutdown complete. Goodbye.');
    process.exit(0);
  }

  private setupShutdownHandlers(): void {
    const shutdown = async () => {
      await this.shutdown();
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
      shutdown();
    });
    process.on('unhandledRejection', (reason) => {
      logger.error(`Unhandled rejection: ${reason}`);
    });
  }

  get isBooted(): boolean {
    return this.booted;
  }

  private startHeartbeat(): void {
    logger.info('Kernel: Starting 1-minute heartbeat...');
    this.heartbeatInterval = setInterval(async () => {
      try {
        const db = getFirestore();
        await db.collection('status').doc('kernel').set({
          status: this.status, // Use the new status property
          lastSeen: new Date(),
          version: '1.0.0',
          agents: agentRegistry.getStatus(),
        }, { merge: true });
        logger.debug('Kernel: Heartbeat updated.');
      } catch (err: any) {
        logger.error(`Kernel: Heartbeat failed: ${err.message}`);
      }
    }, 60 * 1000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      logger.info('Kernel: Heartbeat stopped.');
    }
  }
}

export const kernel = Kernel.getInstance();
