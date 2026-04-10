import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { logger } from './index';

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

const CONFIG_DIR = path.join(os.homedir(), '.agentos');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export class ConfigManager {
    private static instance: ConfigManager;
    private config: LocalConfig;

    private constructor() {
        this.config = this.loadConfig();
    }

    static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    private loadConfig(): LocalConfig {
        const defaultConfig: LocalConfig = {
            llm: {
                provider: 'openai',
                model: 'gpt-4o',
            },
            gateway: {
                port: 4001,
            },
            onboarded: false,
        };

        if (fs.existsSync(CONFIG_FILE)) {
            try {
                const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
                return { ...defaultConfig, ...data };
            } catch (err) {
                logger.error('ConfigManager: Failed to parse config file', err);
            }
        }
        return defaultConfig;
    }

    saveConfig(updates: Partial<LocalConfig>) {
        this.config = { ...this.config, ...updates };
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
        logger.info('ConfigManager: Config saved to ' + CONFIG_FILE);
    }

    getConfig(): LocalConfig {
        return this.config;
    }
}

export const configManager = ConfigManager.getInstance();
