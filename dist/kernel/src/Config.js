"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
// Load .env from root relative to this file
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../../.env') });
function loadYamlOverrides() {
    const yamlPath = path_1.default.join(process.cwd(), '../../agentos.yaml');
    if (fs_1.default.existsSync(yamlPath)) {
        return js_yaml_1.default.load(fs_1.default.readFileSync(yamlPath, 'utf8')) || {};
    }
    return {};
}
function buildConfig() {
    const yaml = loadYamlOverrides();
    return {
        firebase: {
            projectId: process.env.FIREBASE_PROJECT_ID || '',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        },
        jwt: {
            secret: process.env.JWT_SECRET || 'dev-secret-change-me',
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        },
        api: {
            port: parseInt(process.env.API_PORT || '4000'),
            baseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
        },
        mikrotik: {
            apiPort: parseInt(process.env.MIKROTIK_API_PORT || '8728'),
            defaultUser: process.env.MIKROTIK_DEFAULT_USER || 'admin',
            defaultPassword: process.env.MIKROTIK_DEFAULT_PASSWORD || '',
        },
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
            from: process.env.EMAIL_FROM || 'AgentOS <no-reply@agentclaw.com>',
        },
        whatsapp: {
            phoneId: process.env.WHATSAPP_PHONE_ID || '',
            token: process.env.WHATSAPP_TOKEN || '',
            verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
        },
        stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY || '',
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        },
        ecocash: {
            merchantCode: process.env.ECOCASH_MERCHANT_CODE || '',
            apiUrl: process.env.ECOCASH_API_URL || 'https://api.ecocash.co.zw/v1',
            apiKey: process.env.ECOCASH_API_KEY || '',
        },
        zipit: {
            apiUrl: process.env.ZIPIT_API_URL || 'https://api.zipit.co.zw/v1',
            apiKey: process.env.ZIPIT_API_KEY || '',
        },
        printer: {
            type: process.env.PRINTER_TYPE || 'network',
            address: process.env.PRINTER_ADDRESS || '192.168.1.100',
            port: parseInt(process.env.PRINTER_PORT || '9100'),
        },
        predictive: {
            loadThreshold: parseInt(process.env.PREDICTIVE_LOAD_THRESHOLD || '80'),
            pollIntervalMs: parseInt(process.env.PREDICTIVE_POLL_INTERVAL || '300000'),
        },
        skills: {
            dir: path_1.default.resolve(process.cwd(), process.env.MEMORY_DIR || '../../workspace/context/identity'),
        },
        extensions: {
            dir: process.env.EXTENSIONS_DIR || path_1.default.join(process.cwd(), '_extensions'),
        },
        ...yaml,
    };
}
exports.config = buildConfig();
//# sourceMappingURL=Config.js.map