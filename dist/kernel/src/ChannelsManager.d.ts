export interface ChannelConfig {
    whatsapp?: {
        enabled: boolean;
        phoneNumberId?: string;
        accessToken?: string;
    };
    email?: {
        enabled: boolean;
        smtpHost?: string;
        smtpPort?: number;
        smtpUser?: string;
        smtpPass?: string;
    };
    push?: {
        enabled: boolean;
        fcmServerKey?: string;
    };
}
export interface SendMessageParams {
    channel: 'whatsapp' | 'email' | 'push';
    to: string;
    content: string;
    metadata?: Record<string, any>;
}
export declare class ChannelsManager {
    private static instance;
    private config;
    private constructor();
    static getInstance(): ChannelsManager;
    updateConfig(updates: Partial<ChannelConfig>): void;
    getConfig(): ChannelConfig;
    send(params: SendMessageParams): Promise<boolean>;
    getStatus(): Promise<{
        whatsapp: {
            status: string;
        };
        email: {
            status: string;
        };
        push: {
            status: string;
        };
    }>;
}
export declare const channelsManager: ChannelsManager;
//# sourceMappingURL=ChannelsManager.d.ts.map