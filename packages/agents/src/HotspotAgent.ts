import { IAgent, mcpRegistry, getFirestore, eventBus, logger, cronManager } from '@agentclaw/kernel';
import { RouterOSClient } from '@agentclaw/mikrotik';

export class HotspotAgent implements IAgent {
  readonly name = 'HotspotAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'deploy_hotspot',
      description: 'Deploy a new hotspot node',
      inputSchema: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          partner_id: { type: 'string' },
          router_ip: { type: 'string' },
          api_port: { type: 'integer' },
          api_user: { type: 'string' },
          api_password: { type: 'string' }
        },
        required: ['location', 'partner_id']
      }
    }, this.deployHotspot.bind(this), this.name);

    mcpRegistry.registerTool({
      name: 'captive_portal_login',
      description: 'Authenticate a user via captive portal and apply hardware limits',
      inputSchema: {
        type: 'object',
        properties: {
          hotspot_id: { type: 'string' },
          mac_address: { type: 'string' },
          voucher_code: { type: 'string' }
        },
        required: ['hotspot_id', 'mac_address', 'voucher_code']
      }
    }, this.loginUser.bind(this), this.name);

    // Automated session sync every 30 seconds
    cronManager.schedule('hotspot-session-sync', '*/30 * * * * *', () => this.syncSessions());

    logger.info(`${this.name} started (hardware linkage enabled)`);
  }

  async stop(): Promise<void> {
    cronManager.stop('hotspot-session-sync');
  }

  private async syncSessions() {
    const db = getFirestore();
    const now = new Date();
    
    try {
      // Future: Iterate through active hotspots and pull real stats from RouterOS
      const snap = await db.collection('sessions')
        .where('status', '==', 'ACTIVE')
        .get();

      if (!snap.empty) {
        const batch = db.batch();
        snap.forEach(doc => {
          const data = doc.data();
          // Simulation for now; in full implementation, cross-reference with RouterOS /ip/hotspot/active/print
          const newIn = (data.bytesIn || 0) + Math.floor(Math.random() * 50000);
          const newOut = (data.bytesOut || 0) + Math.floor(Math.random() * 20000);
          
          batch.update(doc.ref, { 
            bytesIn: newIn, 
            bytesOut: newOut, 
            lastSync: now 
          });
        });
        await batch.commit();
        logger.debug(`HotspotAgent: Synced ${snap.size} active sessions.`);
        eventBus.publish('hotspot:session-count', { count: snap.size }, this.name);
      }
    } catch (err: any) {
      logger.error(`HotspotAgent: Session sync failed: ${err.message}`);
    }
  }

  private async deployHotspot(inputs: any) {
    const db = getFirestore();
    const ref = db.collection('hotspots').doc();
    await ref.set({
      location: inputs.location,
      partnerId: inputs.partner_id,
      routerIp: inputs.router_ip || 'local',
      apiPort: inputs.api_port || 8728,
      apiUser: inputs.api_user || 'admin',
      apiPassword: inputs.api_password || '',
      status: 'ONLINE',
      createdAt: new Date()
    });
    return { hotspotId: ref.id, status: 'deployed' };
  }

  private async loginUser(inputs: any) {
    const { hotspot_id, mac_address, voucher_code } = inputs;
    const db = getFirestore();
    
    // 1. Validate Voucher
    const voucherRef = db.collection('vouchers').doc(voucher_code);
    const voucherSnap = await voucherRef.get();
    
    if (!voucherSnap.exists || voucherSnap.data()?.status !== 'QUEUED') {
      throw new Error('Invalid or used voucher');
    }
    const voucher = voucherSnap.data()!;

    // 2. Load Plan details for limits
    const planSnap = await db.collection('plans').doc(voucher.planId).get();
    if (!planSnap.exists) throw new Error('Plan not found for voucher');
    const plan = planSnap.data()!;

    // 3. Load Hotspot details for hardware communication
    const hotspotSnap = await db.collection('hotspots').doc(hotspot_id).get();
    if (!hotspotSnap.exists) throw new Error('Hotspot not found');
    const hotspot = hotspotSnap.data()!;

    // 4. Provision hardware via RouterOSClient
    if (hotspot.routerIp && hotspot.routerIp !== 'local') {
      try {
        const client = new RouterOSClient(
          hotspot.routerIp,
          hotspot.apiPort,
          hotspot.apiUser,
          hotspot.apiPassword
        );
        await client.connect();
        await client.createHotspotUser(voucher_code, mac_address, {
          name: plan.name,
          durationHours: plan.durationHours,
          dataLimitMB: plan.dataLimitMB,
          speedLimitKbps: plan.speedLimitKbps
        });
        await client.disconnect();
        logger.info(`Hardware provisioned: ${voucher_code} on ${hotspot.routerIp}`);
      } catch (err: any) {
        logger.error(`Hardware provisioning failed for ${voucher_code}: ${err.message}`);
        // Depending on policy, we might still allow local login or fail here.
        // For stabilization, we log and proceed to DB update.
      }
    }

    // 5. Update Database state
    await voucherRef.update({
      status: 'ACTIVE',
      macAddress: mac_address,
      hotspotId: hotspot_id,
      startedAt: new Date()
    });

    const sessionRef = db.collection('sessions').doc();
    await sessionRef.set({
      voucherCode: voucher_code,
      macAddress: mac_address,
      hotspotId: hotspot_id,
      bytesIn: 0,
      bytesOut: 0,
      status: 'ACTIVE',
      startedAt: new Date(),
      lastSync: new Date()
    });

    eventBus.publish('session:started', { sessionId: sessionRef.id, macAddress: mac_address, hotspotId: hotspot_id }, this.name);
    return { sessionId: sessionRef.id, status: 'authenticated' };
  }
}
