"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryManager = exports.MemoryManager = void 0;
const Logger_1 = require("./Logger");
const Database_1 = require("./Database");
const admin = __importStar(require("firebase-admin"));
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
class MemoryManager {
    static instance;
    constructor() { }
    static getInstance() {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }
    async connect() {
        // RTDB initializes on demand via getRTDB(), but we can trigger it here
        (0, Database_1.getRTDB)();
        Logger_1.logger.info('MemoryManager: Connected to Firebase RTDB');
    }
    async disconnect() {
        // Firebase connection is managed by the SDK
        Logger_1.logger.info('MemoryManager: Disconnected');
    }
    getRef(path) {
        return (0, Database_1.getRTDB)().ref(path);
    }
    // ---- Generic KV Operations ----
    async set(path, value) {
        await this.getRef(path).set(value);
    }
    async get(path) {
        const snap = await this.getRef(path).once('value');
        return snap.exists() ? snap.val() : null;
    }
    async del(path) {
        await this.getRef(path).remove();
    }
    async exists(path) {
        const snap = await this.getRef(path).once('value');
        return snap.exists();
    }
    // ---- Voucher Queue ----
    async queueVoucher(code, planId) {
        // Represents lpush
        await this.getRef('vouchers/queue').push({
            code,
            planId,
            queuedAt: new Date().toISOString(),
            timestamp: admin.database.ServerValue.TIMESTAMP
        });
    }
    async dequeueVoucher() {
        // Represents rpop (oldest first)
        const ref = this.getRef('vouchers/queue');
        const query = ref.orderByChild('timestamp').limitToFirst(1);
        // We use a transaction to safely pop an item, but RTDB transactions are on specific nodes.
        // Instead, we identify the oldest node and try to delete it. If it fails due to race condition, we could retry.
        // For simplicity, doing a read then remove.
        const snap = await query.once('value');
        if (!snap.exists())
            return null;
        let targetKey = null;
        let targetVal = null;
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
    async getQueueLength() {
        const snap = await this.getRef('vouchers/queue').once('value');
        return snap.numChildren();
    }
    async listQueuedVouchers() {
        const snap = await this.getRef('vouchers/queue').once('value');
        const list = [];
        snap.forEach(child => { list.push(child.val()); });
        return list;
    }
    // ---- Session Cache ----
    async cacheSession(mac, data, ttl) {
        // TTL is not natively supported like Redis SETEX.
        // We store an expiresAt timestamp if ttl is provided, and have a cleanup functions.
        const expiresAt = ttl ? Date.now() + (ttl * 1000) : null;
        await this.set(`sessions/${mac.replace(/:/g, '')}`, { ...data, expiresAt });
    }
    async getSession(mac) {
        const data = await this.get(`sessions/${mac.replace(/:/g, '')}`);
        if (data && data.expiresAt && Date.now() > data.expiresAt) {
            await this.clearSession(mac);
            return null;
        }
        return data;
    }
    async clearSession(mac) {
        await this.del(`sessions/${mac.replace(/:/g, '')}`);
    }
    // ---- Print Jobs ----
    async setPrintJob(jobId, status, details) {
        await this.set(`print_jobs/${jobId}`, { status, details, updatedAt: new Date().toISOString() });
    }
    async getPrintJob(jobId) {
        return this.get(`print_jobs/${jobId}`);
    }
    // ---- Predictive Cache ----
    async setPredictiveStats(hotspotId, stats) {
        const expiresAt = Date.now() + (10 * 60 * 1000); // 10 min TTL pseudo-implementation
        await this.set(`predictive/${hotspotId}`, { ...stats, expiresAt });
    }
    async getPredictiveStats(hotspotId) {
        const data = await this.get(`predictive/${hotspotId}`);
        if (data && data.expiresAt && Date.now() > data.expiresAt) {
            await this.del(`predictive/${hotspotId}`);
            return null;
        }
        return data;
    }
    // ---- Wallet Cache ----
    async cacheWalletBalance(walletId, balance) {
        const expiresAt = Date.now() + (5 * 60 * 1000);
        await this.set(`wallets/${walletId}`, { balance, expiresAt });
    }
    async getCachedWalletBalance(walletId) {
        const data = await this.get(`wallets/${walletId}`);
        if (data && data.expiresAt && Date.now() > data.expiresAt) {
            await this.del(`wallets/${walletId}`);
            return null;
        }
        return data ? data.balance : null;
    }
    get connected() {
        return true; // Firebase SDK manages connectivity state automatically
    }
}
exports.MemoryManager = MemoryManager;
exports.memoryManager = MemoryManager.getInstance();
//# sourceMappingURL=MemoryManager.js.map