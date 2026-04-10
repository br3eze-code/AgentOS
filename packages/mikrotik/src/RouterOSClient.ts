import { RouterOSAPI } from 'node-routeros';
import { logger } from '@agentclaw/kernel';
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
export class RouterOSClient {
  private api: RouterOSAPI;
  private connected = false;

  constructor(
    private host: string,
    private port: number = 8728,
    private user: string = 'admin',
    private password: string = ''
  ) {
    this.api = new RouterOSAPI({
      host,
      port,
      user,
      password,
      timeout: 10,
    });
  }

  async connect(): Promise<void> {
    await this.api.connect();
    this.connected = true;
    logger.debug(`RouterOS connected to ${this.host}`);
  }

  async disconnect(): Promise<void> {
    this.api.close();
    this.connected = false;
    logger.debug(`RouterOS disconnected from ${this.host}`);
  }

  private checkConn(): void {
    if (!this.connected) throw new Error(`Not connected to MikroTik ${this.host}`);
  }

  // ----------------------------------------------------------------
  // Hotspot User Management
  // ----------------------------------------------------------------

  /**
   * Create a hotspot user based on a voucher code and plan.
   * Applies bandwidth and time limits from the plan.
   */
  async createHotspotUser(code: string, macAddress: string, plan: HotspotPlan): Promise<void> {
    this.checkConn();

    // Ensure hotspot user profile exists
    await this.ensureUserProfile(plan);

    const params: Record<string, string> = {
      name: code,
      password: code,
      profile: this.profileName(plan.name),
      comment: `AgentOS Voucher - ${new Date().toISOString()}`,
    };

    if (macAddress) {
      params['mac-address'] = macAddress;
    }

    if (plan.durationHours > 0) {
      const hours = plan.durationHours;
      const limitUptime = `${hours > 999 ? '999' : hours}:00:00`;
      params['limit-uptime'] = limitUptime;
    }

    await this.api.write('/ip/hotspot/user/add', Object.entries(params).map(([k, v]) => `=${k}=${v}`));
    logger.debug(`Hotspot user created: ${code} (profile: ${params.profile})`);
  }

  /**
   * Remove a hotspot user by username (voucher code).
   */
  async removeHotspotUser(code: string): Promise<void> {
    this.checkConn();
    try {
      const users = await this.api.write('/ip/hotspot/user/print', [`?name=${code}`]);
      if (users && users.length > 0) {
        await this.api.write('/ip/hotspot/user/remove', [`=.id=${users[0]['.id']}`]);
        logger.debug(`Hotspot user removed: ${code}`);
      }
    } catch (err) {
      logger.warn(`Could not remove hotspot user ${code}: ${(err as Error).message}`);
    }
  }

  /**
   * Get all currently active hotspot sessions.
   */
  async getActiveSessions(): Promise<MikroTikSession[]> {
    this.checkConn();
    const raw = await this.api.write('/ip/hotspot/active/print');
    return (raw || []).map((s: any) => ({
      id: s['.id'],
      user: s['user'],
      address: s['address'],
      macAddress: s['mac-address'],
      uptime: s['uptime'],
      bytesIn: parseInt(s['bytes-in'] || '0'),
      bytesOut: parseInt(s['bytes-out'] || '0'),
      rxRate: parseInt(s['rx-rate'] || '0'),
      txRate: parseInt(s['tx-rate'] || '0'),
      server: s['server'],
    }));
  }

  /**
   * Disconnect an active hotspot session (kick user).
   */
  async kickSession(sessionId: string): Promise<void> {
    this.checkConn();
    await this.api.write('/ip/hotspot/active/remove', [`=.id=${sessionId}`]);
    logger.debug(`Hotspot session kicked: ${sessionId}`);
  }

  // ----------------------------------------------------------------
  // User Profiles (maps to Plans)
  // ----------------------------------------------------------------

  private profileName(planName: string): string {
    return planName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  }

  private async ensureUserProfile(plan: HotspotPlan): Promise<void> {
    const profileName = this.profileName(plan.name);
    const existing = await this.api.write('/ip/hotspot/user/profile/print', [`?name=${profileName}`]);

    if (existing && existing.length > 0) return;

    const params: string[] = [`=name=${profileName}`];

    if (plan.speedLimitKbps) {
      const rate = `${plan.speedLimitKbps}k`;
      params.push(`=rate-limit=${rate}/${rate}`);
    }

    if (plan.dataLimitMB) {
      const limit = `${plan.dataLimitMB * 1024 * 1024}`;
      params.push(`=limit-bytes-total=${limit}`);
    }

    await this.api.write('/ip/hotspot/user/profile/add', params);
    logger.debug(`Created hotspot profile: ${profileName}`);
  }

  // ----------------------------------------------------------------
  // IP Pool & Address Management
  // ----------------------------------------------------------------

  async listIpPools(): Promise<any[]> {
    this.checkConn();
    return this.api.write('/ip/pool/print');
  }

  async addIpPool(name: string, ranges: string): Promise<void> {
    this.checkConn();
    await this.api.write('/ip/pool/add', [`=name=${name}`, `=ranges=${ranges}`]);
  }

  // ----------------------------------------------------------------
  // Full RouterOS Command Passthrough
  // ----------------------------------------------------------------

  async command(path: string, params: string[] = []): Promise<any[]> {
    this.checkConn();
    return this.api.write(path, params);
  }

  // ----------------------------------------------------------------
  // Interface & System Info
  // ----------------------------------------------------------------

  async getSystemInfo(): Promise<Record<string, string>> {
    this.checkConn();
    const result = await this.api.write('/system/resource/print');
    return result?.[0] || {};
  }

  async getInterfaces(): Promise<any[]> {
    this.checkConn();
    return this.api.write('/interface/print');
  }

  async getHotspotServers(): Promise<any[]> {
    this.checkConn();
    return this.api.write('/ip/hotspot/print');
  }

  async getHotspotProfiles(): Promise<any[]> {
    this.checkConn();
    return this.api.write('/ip/hotspot/user/profile/print');
  }

  async getHotspotUsers(): Promise<any[]> {
    this.checkConn();
    return this.api.write('/ip/hotspot/user/print');
  }

  // ----------------------------------------------------------------
  // DHCP & ARP
  // ----------------------------------------------------------------

  async getDhcpLeases(): Promise<any[]> {
    this.checkConn();
    return this.api.write('/ip/dhcp-server/lease/print');
  }

  async getArpTable(): Promise<any[]> {
    this.checkConn();
    return this.api.write('/ip/arp/print');
  }

  // ----------------------------------------------------------------
  // Firewall & Queue
  // ----------------------------------------------------------------

  async getFirewallRules(): Promise<any[]> {
    this.checkConn();
    return this.api.write('/ip/firewall/filter/print');
  }

  async getQueueList(): Promise<any[]> {
    this.checkConn();
    return this.api.write('/queue/simple/print');
  }

  async addSimpleQueue(name: string, target: string, maxLimit: string): Promise<void> {
    this.checkConn();
    await this.api.write('/queue/simple/add', [
      `=name=${name}`,
      `=target=${target}`,
      `=max-limit=${maxLimit}`,
    ]);
  }

  // ----------------------------------------------------------------
  // Wireless
  // ----------------------------------------------------------------

  async getWirelessInterfaces(): Promise<any[]> {
    this.checkConn();
    return this.api.write('/interface/wireless/print');
  }

  async getWirelessRegistrationTable(): Promise<any[]> {
    this.checkConn();
    return this.api.write('/interface/wireless/registration-table/print');
  }
}
