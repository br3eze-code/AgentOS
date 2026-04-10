"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRegistry = exports.AgentRegistry = void 0;
const Logger_1 = require("./Logger");
/**
 * AgentRegistry — registers, starts, stops, and restarts agents.
 * Provides a single place to manage all agent lifecycles.
 */
class AgentRegistry {
    static instance;
    agents = new Map();
    static getInstance() {
        if (!AgentRegistry.instance) {
            AgentRegistry.instance = new AgentRegistry();
        }
        return AgentRegistry.instance;
    }
    /**
     * Register an agent (does not start it)
     */
    register(agent) {
        if (this.agents.has(agent.name)) {
            Logger_1.logger.warn(`Agent "${agent.name}" is already registered. Replacing.`);
        }
        this.agents.set(agent.name, { agent, status: 'stopped' });
        Logger_1.logger.info(`Agent registered: ${agent.name}`);
    }
    /**
     * Start a specific agent by name
     */
    async start(name) {
        const entry = this.agents.get(name);
        if (!entry)
            throw new Error(`Agent "${name}" not registered`);
        if (entry.status === 'running') {
            Logger_1.logger.warn(`Agent "${name}" is already running`);
            return;
        }
        try {
            entry.status = 'starting';
            await entry.agent.start();
            entry.status = 'running';
            Logger_1.logger.info(`Agent started: ${name}`);
        }
        catch (err) {
            entry.status = 'error';
            entry.error = err;
            Logger_1.logger.error(`Agent "${name}" failed to start: ${err.message}`);
            throw err;
        }
    }
    /**
     * Stop a specific agent by name
     */
    async stop(name) {
        const entry = this.agents.get(name);
        if (!entry)
            throw new Error(`Agent "${name}" not registered`);
        try {
            entry.status = 'stopping';
            await entry.agent.stop();
            entry.status = 'stopped';
            Logger_1.logger.info(`Agent stopped: ${name}`);
        }
        catch (err) {
            entry.status = 'error';
            entry.error = err;
            Logger_1.logger.error(`Agent "${name}" failed to stop: ${err.message}`);
        }
    }
    /**
     * Start all registered agents
     */
    async startAll() {
        Logger_1.logger.info(`Starting ${this.agents.size} agents...`);
        for (const [name] of this.agents) {
            await this.start(name);
        }
        Logger_1.logger.info('All agents started.');
    }
    /**
     * Stop all registered agents (in reverse order)
     */
    async stopAll() {
        const names = Array.from(this.agents.keys()).reverse();
        for (const name of names) {
            await this.stop(name);
        }
        Logger_1.logger.info('All agents stopped.');
    }
    /**
     * Restart a specific agent
     */
    async restart(name) {
        await this.stop(name);
        await this.start(name);
    }
    /**
     * Get status of all agents
     */
    getStatus() {
        const status = {};
        for (const [name, entry] of this.agents) {
            status[name] = entry.status;
        }
        return status;
    }
    /**
     * Get a registered agent by name
     */
    get(name) {
        return this.agents.get(name)?.agent;
    }
}
exports.AgentRegistry = AgentRegistry;
exports.agentRegistry = AgentRegistry.getInstance();
//# sourceMappingURL=AgentRegistry.js.map