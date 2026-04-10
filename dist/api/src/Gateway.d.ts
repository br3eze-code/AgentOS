import * as ws from 'ws';
export interface IChannel {
    name: string;
    sendMessage(to: string, message: string): Promise<void>;
    onMessage(handler: (from: string, text: string) => Promise<void>): void;
}
export declare class WSChannel implements IChannel {
    name: string;
    private socket;
    private gateway;
    constructor(name: string, socket: ws.WebSocket, gateway: Gateway);
    sendMessage(to: string, message: string): Promise<void>;
    onMessage(handler: (from: string, text: string) => Promise<void>): void;
}
export declare class ChannelRegistry {
    private channels;
    register(channel: IChannel): void;
    unregister(name: string): void;
    getChannel(name: string): IChannel | undefined;
    getChannelNames(): string[];
}
export declare class Gateway {
    private static instance;
    private channelRegistry;
    private wss;
    private port;
    private constructor();
    getStats(): {
        port: number;
        activeChannels: number;
        channels: string[];
        status: string;
    };
    static getInstance(): Gateway;
    get registry(): ChannelRegistry;
    start(): Promise<void>;
    broadcast(message: string): Promise<void>;
    handleIncomingMessage(channelName: string, from: string, text: string): Promise<void>;
}
export declare const gateway: Gateway;
//# sourceMappingURL=Gateway.d.ts.map