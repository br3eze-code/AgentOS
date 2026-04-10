import { logger } from './Logger';

/**
 * IAgent — interface every agent must implement
 */
export interface IAgent {
  readonly name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
}

type AgentStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

interface AgentEntry {
  agent: IAgent;
  status: AgentStatus;
  error?: Error;
}

/**
 * AgentRegistry — registers, starts, stops, and restarts agents.
 * Provides a single place to manage all agent lifecycles.
 */
export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, AgentEntry> = new Map();

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register an agent (does not start it)
   */
  register(agent: IAgent): void {
    if (this.agents.has(agent.name)) {
      logger.warn(`Agent "${agent.name}" is already registered. Replacing.`);
    }
    this.agents.set(agent.name, { agent, status: 'stopped' });
    logger.info(`Agent registered: ${agent.name}`);
  }

  /**
   * Start a specific agent by name
   */
  async start(name: string): Promise<void> {
    const entry = this.agents.get(name);
    if (!entry) throw new Error(`Agent "${name}" not registered`);

    if (entry.status === 'running') {
      logger.warn(`Agent "${name}" is already running`);
      return;
    }

    try {
      entry.status = 'starting';
      await entry.agent.start();
      entry.status = 'running';
      logger.info(`Agent started: ${name}`);
    } catch (err) {
      entry.status = 'error';
      entry.error = err as Error;
      logger.error(`Agent "${name}" failed to start: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Stop a specific agent by name
   */
  async stop(name: string): Promise<void> {
    const entry = this.agents.get(name);
    if (!entry) throw new Error(`Agent "${name}" not registered`);

    try {
      entry.status = 'stopping';
      await entry.agent.stop();
      entry.status = 'stopped';
      logger.info(`Agent stopped: ${name}`);
    } catch (err) {
      entry.status = 'error';
      entry.error = err as Error;
      logger.error(`Agent "${name}" failed to stop: ${(err as Error).message}`);
    }
  }

  /**
   * Start all registered agents
   */
  async startAll(): Promise<void> {
    logger.info(`Starting ${this.agents.size} agents...`);
    for (const [name] of this.agents) {
      await this.start(name);
    }
    logger.info('All agents started.');
  }

  /**
   * Stop all registered agents (in reverse order)
   */
  async stopAll(): Promise<void> {
    const names = Array.from(this.agents.keys()).reverse();
    for (const name of names) {
      await this.stop(name);
    }
    logger.info('All agents stopped.');
  }

  /**
   * Restart a specific agent
   */
  async restart(name: string): Promise<void> {
    await this.stop(name);
    await this.start(name);
  }

  /**
   * Get status of all agents
   */
  getStatus(): Record<string, AgentStatus> {
    const status: Record<string, AgentStatus> = {};
    for (const [name, entry] of this.agents) {
      status[name] = entry.status;
    }
    return status;
  }

  /**
   * Get a registered agent by name
   */
  get<T extends IAgent>(name: string): T | undefined {
    return this.agents.get(name)?.agent as T | undefined;
  }
}

export const agentRegistry = AgentRegistry.getInstance();
