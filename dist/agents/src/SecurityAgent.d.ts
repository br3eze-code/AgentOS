import { IAgent } from '@agentclaw/kernel';
export declare class SecurityAgent implements IAgent {
    readonly name = "SecurityAgent";
    private macWatch;
    start(): Promise<void>;
    stop(): Promise<void>;
    private auditMAC;
    private scanVulns;
}
//# sourceMappingURL=SecurityAgent.d.ts.map