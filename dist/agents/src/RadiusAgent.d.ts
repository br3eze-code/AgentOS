import { IAgent } from '@agentclaw/kernel';
export declare class RadiusAgent implements IAgent {
    readonly name = "RadiusAgent";
    private adapter;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    private authenticate;
}
//# sourceMappingURL=RadiusAgent.d.ts.map