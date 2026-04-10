"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterOSClient = void 0;
const node_routeros_1 = require("node-routeros");
const kernel_1 = require("@agentclaw/kernel");
/**
 * RouterOSClient — full wrapper around the MikroTik RouterOS API.
 * Exposes all hotspot operations needed by AgentOS.
 */
class RouterOSClient {
    host;
    port;
    user;
    password;
    api;
    connected = false;
    constructor(host, port = 8728, user = 'admin', password = '') {
        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.api = new node_routeros_1.RouterOSAPI({
            host,
            port,
            user,
            password,
            timeout: 10,
        });
    }
    async connect() {
        await this.api.connect();
        this.connected = true;
        kernel_1.logger.debug(`RouterOS connected to ${this.host}`);
    }
    async disconnect() {
        this.api.close();
        this.connected = false;
        kernel_1.logger.debug(`RouterOS disconnected from ${this.host}`);
    }
    checkConn() {
        if (!this.connected)
            throw new Error(`Not connected to MikroTik ${this.host}`);
    }
    // ----------------------------------------------------------------
    // Hotspot User Management
    // ----------------------------------------------------------------
    /**
     * Create a hotspot user based on a voucher code and plan.
     * Applies bandwidth and time limits from the plan.
     */
    async createHotspotUser(code, macAddress, plan) {
        this.checkConn();
        // Ensure hotspot user profile exists
        await this.ensureUserProfile(plan);
        const params = {
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
        kernel_1.logger.debug(`Hotspot user created: ${code} (profile: ${params.profile})`);
    }
    /**
     * Remove a hotspot user by username (voucher code).
     */
    async removeHotspotUser(code) {
        this.checkConn();
        try {
            const users = await this.api.write('/ip/hotspot/user/print', [`?name=${code}`]);
            if (users && users.length > 0) {
                await this.api.write('/ip/hotspot/user/remove', [`=.id=${users[0]['.id']}`]);
                kernel_1.logger.debug(`Hotspot user removed: ${code}`);
            }
        }
        catch (err) {
            kernel_1.logger.warn(`Could not remove hotspot user ${code}: ${err.message}`);
        }
    }
    /**
     * Get all currently active hotspot sessions.
     */
    async getActiveSessions() {
        this.checkConn();
        const raw = await this.api.write('/ip/hotspot/active/print');
        return (raw || []).map((s) => ({
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
    async kickSession(sessionId) {
        this.checkConn();
        await this.api.write('/ip/hotspot/active/remove', [`=.id=${sessionId}`]);
        kernel_1.logger.debug(`Hotspot session kicked: ${sessionId}`);
    }
    // ----------------------------------------------------------------
    // User Profiles (maps to Plans)
    // ----------------------------------------------------------------
    profileName(planName) {
        return planName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    }
    async ensureUserProfile(plan) {
        const profileName = this.profileName(plan.name);
        const existing = await this.api.write('/ip/hotspot/user/profile/print', [`?name=${profileName}`]);
        if (existing && existing.length > 0)
            return;
        const params = [`=name=${profileName}`];
        if (plan.speedLimitKbps) {
            const rate = `${plan.speedLimitKbps}k`;
            params.push(`=rate-limit=${rate}/${rate}`);
        }
        if (plan.dataLimitMB) {
            const limit = `${plan.dataLimitMB * 1024 * 1024}`;
            params.push(`=limit-bytes-total=${limit}`);
        }
        await this.api.write('/ip/hotspot/user/profile/add', params);
        kernel_1.logger.debug(`Created hotspot profile: ${profileName}`);
    }
    // ----------------------------------------------------------------
    // IP Pool & Address Management
    // ----------------------------------------------------------------
    async listIpPools() {
        this.checkConn();
        return this.api.write('/ip/pool/print');
    }
    async addIpPool(name, ranges) {
        this.checkConn();
        await this.api.write('/ip/pool/add', [`=name=${name}`, `=ranges=${ranges}`]);
    }
    // ----------------------------------------------------------------
    // Full RouterOS Command Passthrough
    // ----------------------------------------------------------------
    async command(path, params = []) {
        this.checkConn();
        return this.api.write(path, params);
    }
    // ----------------------------------------------------------------
    // Interface & System Info
    // ----------------------------------------------------------------
    async getSystemInfo() {
        this.checkConn();
        const result = await this.api.write('/system/resource/print');
        return result?.[0] || {};
    }
    async getInterfaces() {
        this.checkConn();
        return this.api.write('/interface/print');
    }
    async getHotspotServers() {
        this.checkConn();
        return this.api.write('/ip/hotspot/print');
    }
    async getHotspotProfiles() {
        this.checkConn();
        return this.api.write('/ip/hotspot/user/profile/print');
    }
    async getHotspotUsers() {
        this.checkConn();
        return this.api.write('/ip/hotspot/user/print');
    }
    // ----------------------------------------------------------------
    // DHCP & ARP
    // ----------------------------------------------------------------
    async getDhcpLeases() {
        this.checkConn();
        return this.api.write('/ip/dhcp-server/lease/print');
    }
    async getArpTable() {
        this.checkConn();
        return this.api.write('/ip/arp/print');
    }
    // ----------------------------------------------------------------
    // Firewall & Queue
    // ----------------------------------------------------------------
    async getFirewallRules() {
        this.checkConn();
        return this.api.write('/ip/firewall/filter/print');
    }
    async getQueueList() {
        this.checkConn();
        return this.api.write('/queue/simple/print');
    }
    async addSimpleQueue(name, target, maxLimit) {
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
    async getWirelessInterfaces() {
        this.checkConn();
        return this.api.write('/interface/wireless/print');
    }
    async getWirelessRegistrationTable() {
        this.checkConn();
        return this.api.write('/interface/wireless/registration-table/print');
    }
}
exports.RouterOSClient = RouterOSClient;
//# sourceMappingURL=RouterOSClient.js.map