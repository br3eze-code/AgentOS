import { IAgent } from '@agentclaw/kernel';
export declare class FirewallAgent implements IAgent {
    readonly name = "FirewallAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private addRule;
}
//# sourceMappingURL=FirewallAgent.d.ts.map