export interface IAgent {
    id: string;
    name: string;
    description: string;
    status: 'IDLE' | 'BUSY' | 'ERROR';
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare abstract class BaseAgent implements IAgent {
    id: string;
    name: string;
    description: string;
    status: 'IDLE' | 'BUSY' | 'ERROR';
    constructor(id: string, name: string, description: string);
    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
    protected publishEvent(type: string, data: any): void;
    protected log(message: string, level?: 'info' | 'warn' | 'error'): void;
}
//# sourceMappingURL=BaseAgent.d.ts.map