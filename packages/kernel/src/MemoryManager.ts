import { logger } from './Logger';
import { getRTDB } from './Database';
import * as admin from 'firebase-admin';

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
export class MemoryManager {
  private static instance: MemoryManager;

  private constructor() {}

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  async connect(): Promise<void> {
    // RTDB initializes on demand via getRTDB(), but we can trigger it here
    getRTDB();
    logger.info('MemoryManager: Connected to Firebase RTDB');
  }

  async disconnect(): Promise<void> {
    // Firebase connection is managed by the SDK
    logger.info('MemoryManager: Disconnected');
  }

  private getRef(path: string): admin.database.Reference {
    return getRTDB().ref(path);
  }

  // ---- Generic KV Operations ----

  async set<T>(path: string, value: T): Promise<void> {
    await this.getRef(path).set(value);
  }

  async get<T>(path: string): Promise<T | null> {
    const snap = await this.getRef(path).once('value');
    return snap.exists() ? (snap.val() as T) : null;
  }

  async del(path: string): Promise<void> {
    await this.getRef(path).remove();
  }

  async exists(path: string): Promise<boolean> {
    const snap = await this.getRef(path).once('value');
    return snap.exists();
  }

  // ---- Voucher Queue ----

  async queueVoucher(code: string, planId: string): Promise<void> {
    // Represents lpush
    await this.getRef('vouchers/queue').push({
      code,
      planId,
      queuedAt: new Date().toISOString(),
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
  }

  async dequeueVoucher(): Promise<{ code: string; planId: string; queuedAt: string } | null> {
    // Represents rpop (oldest first)
    const ref = this.getRef('vouchers/queue');
    const query = ref.orderByChild('timestamp').limitToFirst(1);
    
    // We use a transaction to safely pop an item, but RTDB transactions are on specific nodes.
    // Instead, we identify the oldest node and try to delete it. If it fails due to race condition, we could retry.
    // For simplicity, doing a read then remove.
    const snap = await query.once('value');
    if (!snap.exists()) return null;

    let targetKey: string | null = null;
    let targetVal: any = null;
    snap.forEach(child => {
      targetKey = child.key;
      targetVal = child.val();
      return true; // cancel after first
    });

    if (targetKey) {
      await ref.child(targetKey).remove();
      return targetVal;
    }
    return null;
  }

  async getQueueLength(): Promise<number> {
    const snap = await this.getRef('vouchers/queue').once('value');
    return snap.numChildren();
  }

  async listQueuedVouchers(): Promise<{ code: string; planId: string; queuedAt: string }[]> {
    const snap = await this.getRef('vouchers/queue').once('value');
    const list: any[] = [];
    snap.forEach(child => { list.push(child.val()); });
    return list;
  }

  // ---- Session Cache ----

  async cacheSession(mac: string, data: Record<string, unknown>, ttl?: number): Promise<void> {
    // TTL is not natively supported like Redis SETEX.
    // We store an expiresAt timestamp if ttl is provided, and have a cleanup functions.
    const expiresAt = ttl ? Date.now() + (ttl * 1000) : null;
    await this.set(`sessions/${mac.replace(/:/g, '')}`, { ...data, expiresAt });
  }

  async getSession(mac: string): Promise<Record<string, unknown> | null> {
    const data = await this.get<Record<string, unknown>>(`sessions/${mac.replace(/:/g, '')}`);
    if (data && data.expiresAt && Date.now() > (data.expiresAt as number)) {
      await this.clearSession(mac);
      return null;
    }
    return data;
  }

  async clearSession(mac: string): Promise<void> {
    await this.del(`sessions/${mac.replace(/:/g, '')}`);
  }

  // ---- Print Jobs ----

  async setPrintJob(jobId: string, status: string, details?: Record<string, unknown>): Promise<void> {
    await this.set(`print_jobs/${jobId}`, { status, details, updatedAt: new Date().toISOString() });
  }

  async getPrintJob(jobId: string): Promise<{ status: string; details?: Record<string, unknown> } | null> {
    return this.get(`print_jobs/${jobId}`);
  }

  // ---- Predictive Cache ----

  async setPredictiveStats(hotspotId: string, stats: { loadPercent: number; activeSessions: number }): Promise<void> {
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 min TTL pseudo-implementation
    await this.set(`predictive/${hotspotId}`, { ...stats, expiresAt });
  }

  async getPredictiveStats(hotspotId: string): Promise<{ loadPercent: number; activeSessions: number } | null> {
    const data = await this.get<any>(`predictive/${hotspotId}`);
    if (data && data.expiresAt && Date.now() > data.expiresAt) {
      await this.del(`predictive/${hotspotId}`);
      return null;
    }
    return data;
  }

  // ---- Wallet Cache ----

  async cacheWalletBalance(walletId: string, balance: number): Promise<void> {
    const expiresAt = Date.now() + (5 * 60 * 1000);
    await this.set(`wallets/${walletId}`, { balance, expiresAt });
  }

  async getCachedWalletBalance(walletId: string): Promise<number | null> {
    const data = await this.get<any>(`wallets/${walletId}`);
    if (data && data.expiresAt && Date.now() > data.expiresAt) {
      await this.del(`wallets/${walletId}`);
      return null;
    }
    return data ? data.balance : null;
  }

  get connected(): boolean {
    return true; // Firebase SDK manages connectivity state automatically
  }
}

export const memoryManager = MemoryManager.getInstance();
