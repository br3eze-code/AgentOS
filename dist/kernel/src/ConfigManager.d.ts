export interface LocalConfig {
    llm: {
        provider: 'openai' | 'anthropic' | 'google' | 'ollama';
        model: string;
        apiKey?: string;
    };
    gateway: {
        port: number;
    };
    onboarded: boolean;
}
export declare class ConfigManager {
    private static instance;
    private config;
    private constructor();
    static getInstance(): ConfigManager;
    private loadConfig;
    saveConfig(updates: Partial<LocalConfig>): void;
    getConfig(): LocalConfig;
}
export declare const configManager: ConfigManager;
//# sourceMappingURL=ConfigManager.d.ts.map