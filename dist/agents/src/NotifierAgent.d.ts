import { IAgent } from '@agentclaw/kernel';
export declare class NotifierAgent implements IAgent {
    readonly name = "NotifierAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private sendNotification;
}
//# sourceMappingURL=NotifierAgent.d.ts.map