import { IAgent } from '@agentclaw/kernel';
export declare class DeviceAgent implements IAgent {
    readonly name = "DeviceAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private getStatus;
}
//# sourceMappingURL=DeviceAgent.d.ts.map