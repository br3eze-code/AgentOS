/**
 * MemoryManager — Firebase RTDB-backed distributed state store.
 * Replaces Redis for global edge/cloud state synchronization.
 *
 * Namespaces/Paths:
 *   vouchers/queue    — voucher codes pending activation
 *   sessions/<mac>    — active hotspot session data
 *   print_jobs/<id>   — print job status
 *   predictive/<hid>  — cached hotspot load stats
 *   wallets/<id>      — cached wallet balances
 */
export declare class MemoryManager {
    private static instance;
    private constructor();
    static getInstance(): MemoryManager;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private getRef;
    set<T>(path: string, value: T): Promise<void>;
    get<T>(path: string): Promise<T | null>;
    del(path: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    queueVoucher(code: string, planId: string): Promise<void>;
    dequeueVoucher(): Promise<{
        code: string;
        planId: string;
        queuedAt: string;
    } | null>;
    getQueueLength(): Promise<number>;
    listQueuedVouchers(): Promise<{
        code: string;
        planId: string;
        queuedAt: string;
    }[]>;
    cacheSession(mac: string, data: Record<string, unknown>, ttl?: number): Promise<void>;
    getSession(mac: string): Promise<Record<string, unknown> | null>;
    clearSession(mac: string): Promise<void>;
    setPrintJob(jobId: string, status: string, details?: Record<string, unknown>): Promise<void>;
    getPrintJob(jobId: string): Promise<{
        status: string;
        details?: Record<string, unknown>;
    } | null>;
    setPredictiveStats(hotspotId: string, stats: {
        loadPercent: number;
        activeSessions: number;
    }): Promise<void>;
    getPredictiveStats(hotspotId: string): Promise<{
        loadPercent: number;
        activeSessions: number;
    } | null>;
    cacheWalletBalance(walletId: string, balance: number): Promise<void>;
    getCachedWalletBalance(walletId: string): Promise<number | null>;
    get connected(): boolean;
}
export declare const memoryManager: MemoryManager;
//# sourceMappingURL=MemoryManager.d.ts.map