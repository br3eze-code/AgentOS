import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';
import { v4 as uuidv4 } from 'uuid';

export class PlanAgent implements IAgent {
  readonly name = 'PlanAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'create_plan',
      description: 'Create a new WiFi billing plan',
      inputSchema: {
        type: 'object',
        properties: {
          plan_name: { type: 'string' },
          price: { type: 'number' },
          duration_hours: { type: 'integer' },
          bandwidth_limit_kbps: { type: 'integer' }
        },
        required: ['plan_name', 'price', 'duration_hours']
      }
    }, this.createPlan.bind(this));

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async createPlan(inputs: any) {
    const db = getFirestore();
    const planId = 'pl_' + uuidv4().split('-')[0];
    
    await db.collection('plans').doc(planId).set({
      name: inputs.plan_name,
      price: inputs.price,
      durationHours: inputs.duration_hours,
      bandwidthLimitKbps: inputs.bandwidth_limit_kbps || 0,
      active: true,
      createdAt: new Date()
    });

    return { plan_id: planId, status: 'created' };
  }
}
