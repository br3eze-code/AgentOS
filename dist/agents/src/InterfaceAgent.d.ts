import { IAgent } from '@agentclaw/kernel';
export declare class InterfaceAgent implements IAgent {
    readonly name = "InterfaceAgent";
    start(): Promise<void>;
    stop(): Promise<void>;
    private listInterfaces;
    private createBridge;
}
//# sourceMappingURL=InterfaceAgent.d.ts.map