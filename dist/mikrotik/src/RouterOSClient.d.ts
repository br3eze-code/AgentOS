import { MikroTikSession } from '@agentclaw/shared';
export interface HotspotPlan {
    name: string;
    durationHours: number;
    dataLimitMB?: number | null;
    speedLimitKbps?: number | null;
}
/**
 * RouterOSClient — full wrapper around the MikroTik RouterOS API.
 * Exposes all hotspot operations needed by AgentOS.
 */
export declare class RouterOSClient {
    private host;
    private port;
    private user;
    private password;
    private api;
    private connected;
    constructor(host: string, port?: number, user?: string, password?: string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private checkConn;
    /**
     * Create a hotspot user based on a voucher code and plan.
     * Applies bandwidth and time limits from the plan.
     */
    createHotspotUser(code: string, macAddress: string, plan: HotspotPlan): Promise<void>;
    /**
     * Remove a hotspot user by username (voucher code).
     */
    removeHotspotUser(code: string): Promise<void>;
    /**
     * Get all currently active hotspot sessions.
     */
    getActiveSessions(): Promise<MikroTikSession[]>;
    /**
     * Disconnect an active hotspot session (kick user).
     */
    kickSession(sessionId: string): Promise<void>;
    private profileName;
    private ensureUserProfile;
    listIpPools(): Promise<any[]>;
    addIpPool(name: string, ranges: string): Promise<void>;
    command(path: string, params?: string[]): Promise<any[]>;
    getSystemInfo(): Promise<Record<string, string>>;
    getInterfaces(): Promise<any[]>;
    getHotspotServers(): Promise<any[]>;
    getHotspotProfiles(): Promise<any[]>;
    getHotspotUsers(): Promise<any[]>;
    getDhcpLeases(): Promise<any[]>;
    getArpTable(): Promise<any[]>;
    getFirewallRules(): Promise<any[]>;
    getQueueList(): Promise<any[]>;
    addSimpleQueue(name: string, target: string, maxLimit: string): Promise<void>;
    getWirelessInterfaces(): Promise<any[]>;
    getWirelessRegistrationTable(): Promise<any[]>;
}
//# sourceMappingURL=RouterOSClient.d.ts.map