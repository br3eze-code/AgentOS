import { IAgent } from '@agentclaw/kernel';
export declare class MonitorAgent implements IAgent {
    readonly name = "MonitorAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private getTelemetry;
}
//# sourceMappingURL=MonitorAgent.d.ts.map