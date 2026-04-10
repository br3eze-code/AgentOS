import { IAgent, mcpRegistry, getFirestore, eventBus, logger } from '@agentclaw/kernel';
import { RouterOSClient } from '@agentclaw/mikrotik';

export class SessionAgent implements IAgent {
  readonly name = 'SessionAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'disconnect_user',
      description: 'Drop a user active connection based on IP or MAC',
      inputSchema: {
        type: 'object',
        properties: {
          ip_address: { type: 'string' },
          mac_address: { type: 'string' },
          reason: { type: 'string' }
        }
      }
    }, this.disconnectUser.bind(this), this.name);

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async disconnectUser(inputs: any) {
    const { ip_address, mac_address, reason } = inputs;
    const db = getFirestore();
    
    // 1. Find the active session
    let query: any = db.collection('sessions').where('status', '==', 'ACTIVE');
    if (mac_address) {
      query = query.where('macAddress', '==', mac_address);
    } else if (ip_address) {
      query = query.where('ipAddress', '==', ip_address);
    } else {
      return { success: false, error: 'Either ip_address or mac_address required' };
    }

    const sessionQuery = await query.limit(1).get();
    if (sessionQuery.empty) {
      return { success: false, error: 'Active session not found' };
    }

    const sessionDoc = sessionQuery.docs[0];
    const session = sessionDoc.data();

    // 2. Hardware Kicking
    const hotspotSnap = await db.collection('hotspots').doc(session.hotspotId).get();
    if (hotspotSnap.exists) {
      const hotspot = hotspotSnap.data()!;
      if (hotspot.routerIp && hotspot.routerIp !== 'local') {
        try {
          const client = new RouterOSClient(hotspot.routerIp, hotspot.apiPort, hotspot.apiUser, hotspot.apiPassword);
          await client.connect();
          
          // Find the active session ID in RouterOS by MAC or Username
          const active = await client.getActiveSessions();
          const target = active.find(s => s.macAddress === session.macAddress || s.user === session.voucherCode);
          
          if (target) {
            await client.kickSession(target.id);
            logger.info(`Session kicked on hardware: ${session.macAddress} (${hotspot.routerIp})`);
          }
          await client.disconnect();
        } catch (err: any) {
          logger.error(`Hardware kick failed for ${session.macAddress}: ${err.message}`);
        }
      }
    }

    // 3. Update DB
    await sessionDoc.ref.update({ 
      status: 'ENDED', 
      endedReason: reason || 'manual',
      endedAt: new Date()
    });
    
    eventBus.publish('session:ended', { sessionId: sessionDoc.id, macAddress: session.macAddress, reason }, this.name);
    return { success: true, status: 'disconnected' };
  }
}
