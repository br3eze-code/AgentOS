import { IAgent } from '@agentclaw/kernel';
export declare class HotspotAgent implements IAgent {
    readonly name = "HotspotAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private syncSessions;
    private deployHotspot;
    private loginUser;
}
//# sourceMappingURL=HotspotAgent.d.ts.map