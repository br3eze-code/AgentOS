import { eventBus, logger } from '@agentclaw/kernel';

export interface IAgent {
    id: string;
    name: string;
    description: string;
    status: 'IDLE' | 'BUSY' | 'ERROR';
    start(): Promise<void>;
    stop(): Promise<void>;
}

export abstract class BaseAgent implements IAgent {
    public status: 'IDLE' | 'BUSY' | 'ERROR' = 'IDLE';

    constructor(
        public id: string,
        public name: string,
        public description: string
    ) {}

    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;

    protected publishEvent(type: string, data: any) {
        eventBus.publish(type, data, this.name);
        logger.debug(`${this.name}: Published event '${type}'`);
    }

    protected log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
        logger[level](`${this.name}: ${message}`);
    }
}
