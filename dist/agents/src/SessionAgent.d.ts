import { IAgent } from '@agentclaw/kernel';
export declare class SessionAgent implements IAgent {
    readonly name = "SessionAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private disconnectUser;
}
//# sourceMappingURL=SessionAgent.d.ts.map