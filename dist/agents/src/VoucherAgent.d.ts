import { IAgent } from '@agentclaw/kernel';
export declare class VoucherAgent implements IAgent {
    readonly name = "VoucherAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private checkExpirations;
    private generateVouchers;
}
//# sourceMappingURL=VoucherAgent.d.ts.map