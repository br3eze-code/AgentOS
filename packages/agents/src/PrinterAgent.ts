import { IAgent, mcpRegistry, getFirestore, logger } from '@agentclaw/kernel';

export class PrinterAgent implements IAgent {
  readonly name = 'PrinterAgent';

  async start(): Promise<void> {
    mcpRegistry.registerTool({
      name: 'print_voucher',
      description: 'Send a voucher to a network POS printer',
      inputSchema: {
        type: 'object',
        properties: {
          printer_ip: { type: 'string' },
          voucher_code: { type: 'string' }
        },
        required: ['printer_ip', 'voucher_code']
      }
    }, this.printVoucher.bind(this));

    logger.info(`${this.name} started`);
  }

  async stop(): Promise<void> {}

  private async printVoucher(inputs: any) {
    const db = getFirestore();
    const ref = db.collection('print_jobs').doc();
    await ref.set({
      printerIp: inputs.printer_ip,
      voucherCode: inputs.voucher_code,
      status: 'QUEUED',
      createdAt: new Date()
    });
    return { jobId: ref.id, status: 'queued' };
  }
}
