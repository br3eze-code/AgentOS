import { IAgent } from '@agentclaw/kernel';
export declare class DHCPAgent implements IAgent {
    readonly name = "DHCPAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private createPool;
}
//# sourceMappingURL=DHCPAgent.d.ts.map