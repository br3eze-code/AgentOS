/**
 * IAgent — interface every agent must implement
 */
export interface IAgent {
    readonly name: string;
    start(): Promise<void>;
    stop(): Promise<void>;
}
type AgentStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
/**
 * AgentRegistry — registers, starts, stops, and restarts agents.
 * Provides a single place to manage all agent lifecycles.
 */
export declare class AgentRegistry {
    private static instance;
    private agents;
    static getInstance(): AgentRegistry;
    /**
     * Register an agent (does not start it)
     */
    register(agent: IAgent): void;
    /**
     * Start a specific agent by name
     */
    start(name: string): Promise<void>;
    /**
     * Stop a specific agent by name
     */
    stop(name: string): Promise<void>;
    /**
     * Start all registered agents
     */
    startAll(): Promise<void>;
    /**
     * Stop all registered agents (in reverse order)
     */
    stopAll(): Promise<void>;
    /**
     * Restart a specific agent
     */
    restart(name: string): Promise<void>;
    /**
     * Get status of all agents
     */
    getStatus(): Record<string, AgentStatus>;
    /**
     * Get a registered agent by name
     */
    get<T extends IAgent>(name: string): T | undefined;
}
export declare const agentRegistry: AgentRegistry;
export {};
//# sourceMappingURL=AgentRegistry.d.ts.map