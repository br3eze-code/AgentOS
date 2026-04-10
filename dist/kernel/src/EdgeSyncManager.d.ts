/**
 * EdgeSyncManager — Mirrors critical Firestore state to local MemoryManager
 * for high-performance retrieval and offline-first capabilities.
 */
export declare class EdgeSyncManager {
    private static instance;
    private unsubscribers;
    constructor();
    static getInstance(): EdgeSyncManager;
    start(): Promise<void>;
    stop(): Promise<void>;
    getCachedVoucher(code: string): Promise<any>;
    getCachedPlan(planId: string): Promise<any>;
}
export declare const edgeSyncManager: EdgeSyncManager;
//# sourceMappingURL=EdgeSyncManager.d.ts.map