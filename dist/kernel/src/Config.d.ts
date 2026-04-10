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
export declare const config: AppConfig;
//# sourceMappingURL=Config.d.ts.map