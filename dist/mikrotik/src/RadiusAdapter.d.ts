/**
 * RadiusAdapter — simple RADIUS Auth + Accounting server.
 * Validates voucher codes from the AgentOS DB.
 * Auth: validates voucher code as username + password.
 * Accounting: updates session bytes/time in DB.
 */
export declare class RadiusAdapter {
    private server;
    private readonly port;
    private readonly secret;
    constructor(port?: number, secret?: string);
    start(): void;
    stop(): void;
    private handlePacket;
    private handleAuth;
    private handleAccounting;
    private sendAccept;
    private sendReject;
    private sendAccountingResponse;
    private send;
    private buildAttr;
    private parseAttributes;
}
//# sourceMappingURL=RadiusAdapter.d.ts.map