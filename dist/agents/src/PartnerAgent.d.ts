import { IAgent } from '@agentclaw/kernel';
export declare class PartnerAgent implements IAgent {
    readonly name = "PartnerAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private registerPartner;
    private calculatePayouts;
}
//# sourceMappingURL=PartnerAgent.d.ts.map