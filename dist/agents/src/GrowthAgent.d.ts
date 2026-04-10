import { IAgent } from '@agentclaw/kernel';
export declare class GrowthAgent implements IAgent {
    readonly name = "GrowthAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private recordRevenue;
    private analyzeTrends;
}
//# sourceMappingURL=GrowthAgent.d.ts.map