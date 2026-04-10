/**
 * AgentOS Kernel — the heart of the system.
 * Boots all subsystems in order: DB → Redis → Agents
 * Provides graceful shutdown on process signals.
 */
export declare class Kernel {
    private static instance;
    private booted;
    private heartbeatInterval?;
    private status;
    private constructor();
    static getInstance(): Kernel;
    /**
     * Boot the kernel.
     * Agents must be registered BEFORE calling boot().
     */
    boot(): Promise<void>;
    /**
     * Shutdown the kernel gracefully.
     */
    shutdown(): Promise<void>;
    private setupShutdownHandlers;
    get isBooted(): boolean;
    private startHeartbeat;
    private stopHeartbeat;
}
export declare const kernel: Kernel;
//# sourceMappingURL=Kernel.d.ts.map