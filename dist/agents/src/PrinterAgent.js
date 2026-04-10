"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrinterAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class PrinterAgent {
    name = 'PrinterAgent';
    async start() {
        kernel_1.mcpRegistry.registerTool({
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
        kernel_1.logger.info(`${this.name} started`);
    }
    async stop() { }
    async printVoucher(inputs) {
        const db = (0, kernel_1.getFirestore)();
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
exports.PrinterAgent = PrinterAgent;
//# sourceMappingURL=PrinterAgent.js.map