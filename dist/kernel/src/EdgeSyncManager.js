"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.edgeSyncManager = exports.EdgeSyncManager = void 0;
const kernel_1 = require("@agentclaw/kernel");
/**
 * EdgeSyncManager — Mirrors critical Firestore state to local MemoryManager
 * for high-performance retrieval and offline-first capabilities.
 */
class EdgeSyncManager {
    static instance;
    unsubscribers = [];
    constructor() { }
    static getInstance() {
        if (!EdgeSyncManager.instance) {
            EdgeSyncManager.instance = new EdgeSyncManager();
        }
        return EdgeSyncManager.instance;
    }
    async start() {
        kernel_1.logger.info('EdgeSyncManager starting mirrors...');
        const db = (0, kernel_1.getFirestore)();
        // 1. Mirror Plans
        const plansUnsub = db.collection('plans').where('active', '==', true).onSnapshot(snap => {
            snap.forEach(async (doc) => {
                await kernel_1.memoryManager.set(`sync:plan:${doc.id}`, doc.data());
            });
            kernel_1.logger.debug(`EdgeSync: Mirrored ${snap.size} plans to local cache.`);
        });
        this.unsubscribers.push(plansUnsub);
        // 2. Mirror Vouchers (Active/New only)
        const vouchersUnsub = db.collection('vouchers')
            .where('status', 'in', ['NEW', 'ACTIVE'])
            .onSnapshot(snap => {
            snap.forEach(async (doc) => {
                await kernel_1.memoryManager.set(`sync:voucher:${doc.id}`, doc.data());
            });
            kernel_1.logger.debug(`EdgeSync: Mirrored ${snap.size} active/new vouchers.`);
        });
        this.unsubscribers.push(vouchersUnsub);
        // 3. Mirror Hotspots
        const hotspotUnsub = db.collection('hotspots').onSnapshot(snap => {
            snap.forEach(async (doc) => {
                await kernel_1.memoryManager.set(`sync:hotspot:${doc.id}`, doc.data());
            });
        });
        this.unsubscribers.push(hotspotUnsub);
    }
    async stop() {
        this.unsubscribers.forEach(unsub => unsub());
        kernel_1.logger.info('EdgeSyncManager stopped mirrors.');
    }
    async getCachedVoucher(code) {
        return kernel_1.memoryManager.get(`sync:voucher:${code}`);
    }
    async getCachedPlan(planId) {
        return kernel_1.memoryManager.get(`sync:plan:${planId}`);
    }
}
exports.EdgeSyncManager = EdgeSyncManager;
exports.edgeSyncManager = EdgeSyncManager.getInstance();
//# sourceMappingURL=EdgeSyncManager.js.map