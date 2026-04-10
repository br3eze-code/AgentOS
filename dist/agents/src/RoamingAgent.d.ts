import { IAgent } from '@agentclaw/kernel';
export declare class RoamingAgent implements IAgent {
    readonly name = "RoamingAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private roamSession;
}
//# sourceMappingURL=RoamingAgent.d.ts.map