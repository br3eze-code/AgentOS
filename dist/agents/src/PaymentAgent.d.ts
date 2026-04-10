import { IAgent } from '@agentclaw/kernel';
export declare class PaymentAgent implements IAgent {
    readonly name = "PaymentAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private processPayment;
}
//# sourceMappingURL=PaymentAgent.d.ts.map