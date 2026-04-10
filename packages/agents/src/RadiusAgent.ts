import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';
import { RadiusAdapter } from '@agentclaw/mikrotik';

export class RadiusAgent implements IAgent {
  readonly name = 'RadiusAgent';
  private adapter: RadiusAdapter;

  constructor() {
    this.adapter = new RadiusAdapter(1812, process.env.RADIUS_SECRET || 'agentclaw-secret');
  }

  async start(): Promise<void> {
    // 1. Start the RADIUS UDP server
    this.adapter.start();

    // 2. Register MCP Tool for manual auth checks
    mcpRegistry.registerTool({
      name: 'radius_auth',
      description: 'Manually authenticate a RADIUS request (for testing)',
      inputSchema: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          password: { type: 'string' }
        },
        required: ['username', 'password']
      }
    }, this.authenticate.bind(this));

    logger.info(`${this.name} started (UDP port 1812)`);
  }

  async stop(): Promise<void> {
    this.adapter.stop();
    logger.info(`${this.name} stopped`);
  }

  private async authenticate(inputs: any) {
    // Basic RADIUS auth logic integrating with Firestore vouchers
    const db = getFirestore();
    const snap = await db.collection('vouchers').where('code', '==', inputs.username).limit(1).get();
    
    if (!snap.empty) {
      const voucher = snap.docs[0].data();
      if (voucher.status === 'ACTIVE' || voucher.status === 'NEW') {
        return { status: 'Access-Accept' };
      }
    }
    return { status: 'Access-Reject' };
  }
}
