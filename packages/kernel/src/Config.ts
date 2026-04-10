import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

// Load .env from root relative to this file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export interface AppConfig {
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
    databaseURL?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  api: {
    port: number;
    baseUrl: string;
  };
  mikrotik: {
    apiPort: number;
    defaultUser: string;
    defaultPassword: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  whatsapp: {
    phoneId: string;
    token: string;
    verifyToken: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  ecocash: {
    merchantCode: string;
    apiUrl: string;
    apiKey: string;
  };
  zipit: {
    apiUrl: string;
    apiKey: string;
  };
  printer: {
    type: 'usb' | 'network';
    address: string;
    port: number;
  };
  predictive: {
    loadThreshold: number;
    pollIntervalMs: number;
  };
  skills: {
    dir: string;
  };
  extensions: {
    dir: string;
  };
}

function loadYamlOverrides(): Partial<AppConfig> {
  const yamlPath = path.join(process.cwd(), '../../agentos.yaml');
  if (fs.existsSync(yamlPath)) {
    return (yaml.load(fs.readFileSync(yamlPath, 'utf8')) as Partial<AppConfig>) || {};
  }
  return {};
}

function buildConfig(): AppConfig {
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
      type: (process.env.PRINTER_TYPE as 'usb' | 'network') || 'network',
      address: process.env.PRINTER_ADDRESS || '192.168.1.100',
      port: parseInt(process.env.PRINTER_PORT || '9100'),
    },
    predictive: {
      loadThreshold: parseInt(process.env.PREDICTIVE_LOAD_THRESHOLD || '80'),
      pollIntervalMs: parseInt(process.env.PREDICTIVE_POLL_INTERVAL || '300000'),
    },
    skills: {
      dir: path.resolve(process.cwd(), process.env.MEMORY_DIR || '../../workspace/context/identity'),
    },
    extensions: {
      dir: process.env.EXTENSIONS_DIR || path.join(process.cwd(), '_extensions'),
    },
    ...yaml,
  };
}

export const config = buildConfig();
