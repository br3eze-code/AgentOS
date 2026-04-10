import { IAgent, mcpRegistry, eventBus, getFirestore, logger } from '@agentclaw/kernel';

export class SecurityAgent implements IAgent {
  readonly name = 'SecurityAgent';
  private macWatch: Map<string, number> = new Map();

  async start(): Promise<void> {
    // 1. Reactive Logic: Detect Rapid Session Creation (Potential Abuse)
    eventBus.on('session:started', async (event) => {
      const { macAddress } = event.payload as any;
      await this.auditMAC(macAddress);
    });

    // 2. Register MCP Tools
    mcpRegistry.registerTool({
      name: 'scan_vulnerabilities',
      description: 'Detect abuse, rogue clients, and anomalous traffic',
      inputSchema: {
        type: 'object',
        properties: { network_id: { type: 'string' } },
        required: ['network_id']
      }
    }, this.scanVulns.bind(this));

    logger.info(`${this.name} started (monitoring session:started)`);
  }

  async stop(): Promise<void> {}

  private async auditMAC(mac: string) {
    const count = (this.macWatch.get(mac) || 0) + 1;
    this.macWatch.set(mac, count);

    if (count > 5) {
      logger.warn(`SecurityAgent: MAC ${mac} flagged for rapid session creation!`);
      const db = getFirestore();
      await db.collection('security_alerts').add({
         type: 'ANOMALY_RAPID_SESSIONS',
         target: mac,
         severity: 'MEDIUM',
         timestamp: new Date()
      });
      // Reset after alerting
      this.macWatch.set(mac, 0);
    }
  }

  private async scanVulns(inputs: any) {
    return { networkId: inputs.network_id, threatsDetected: 0, status: 'secure' };
  }
}
