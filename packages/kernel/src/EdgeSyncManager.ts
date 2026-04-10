import { getFirestore, logger, memoryManager } from '@agentclaw/kernel';

/**
 * EdgeSyncManager — Mirrors critical Firestore state to local MemoryManager
 * for high-performance retrieval and offline-first capabilities.
 */
export class EdgeSyncManager {
  private static instance: EdgeSyncManager;
  private unsubscribers: Function[] = [];

  constructor() {}

  static getInstance(): EdgeSyncManager {
    if (!EdgeSyncManager.instance) {
      EdgeSyncManager.instance = new EdgeSyncManager();
    }
    return EdgeSyncManager.instance;
  }

  async start(): Promise<void> {
    logger.info('EdgeSyncManager starting mirrors...');
    
    const db = getFirestore();

    // 1. Mirror Plans
    const plansUnsub = db.collection('plans').where('active', '==', true).onSnapshot(snap => {
      snap.forEach(async doc => {
        await memoryManager.set(`sync:plan:${doc.id}`, doc.data());
      });
      logger.debug(`EdgeSync: Mirrored ${snap.size} plans to local cache.`);
    });
    this.unsubscribers.push(plansUnsub);

    // 2. Mirror Vouchers (Active/New only)
    const vouchersUnsub = db.collection('vouchers')
      .where('status', 'in', ['NEW', 'ACTIVE'])
      .onSnapshot(snap => {
        snap.forEach(async doc => {
          await memoryManager.set(`sync:voucher:${doc.id}`, doc.data());
        });
        logger.debug(`EdgeSync: Mirrored ${snap.size} active/new vouchers.`);
      });
    this.unsubscribers.push(vouchersUnsub);

    // 3. Mirror Hotspots
    const hotspotUnsub = db.collection('hotspots').onSnapshot(snap => {
      snap.forEach(async doc => {
        await memoryManager.set(`sync:hotspot:${doc.id}`, doc.data());
      });
    });
    this.unsubscribers.push(hotspotUnsub);
  }

  async stop(): Promise<void> {
    this.unsubscribers.forEach(unsub => unsub());
    logger.info('EdgeSyncManager stopped mirrors.');
  }

  async getCachedVoucher(code: string): Promise<any> {
    return memoryManager.get(`sync:voucher:${code}`);
  }

  async getCachedPlan(planId: string): Promise<any> {
    return memoryManager.get(`sync:plan:${planId}`);
  }
}

export const edgeSyncManager = EdgeSyncManager.getInstance();
