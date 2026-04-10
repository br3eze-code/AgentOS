"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.configManager = exports.ConfigManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const index_1 = require("./index");
const CONFIG_DIR = path.join(os.homedir(), '.agentos');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
class ConfigManager {
    static instance;
    config;
    constructor() {
        this.config = this.loadConfig();
    }
    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    loadConfig() {
        const defaultConfig = {
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
            }
            catch (err) {
                index_1.logger.error('ConfigManager: Failed to parse config file', err);
            }
        }
        return defaultConfig;
    }
    saveConfig(updates) {
        this.config = { ...this.config, ...updates };
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
        index_1.logger.info('ConfigManager: Config saved to ' + CONFIG_FILE);
    }
    getConfig() {
        return this.config;
    }
}
exports.ConfigManager = ConfigManager;
exports.configManager = ConfigManager.getInstance();
//# sourceMappingURL=ConfigManager.js.map