export type Role = 'ADMIN' | 'PARTNER' | 'CASHIER' | 'USER';
export type VoucherStatus = 'QUEUED' | 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'WALLET' | 'STRIPE' | 'ECOCASH' | 'ZIPIT';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'PUSH' | 'PORTAL';
export type SessionStatus = 'ACTIVE' | 'ENDED' | 'ROAMED';
export type PrintJobStatus = 'QUEUED' | 'PRINTING' | 'DONE' | 'FAILED';
export interface AgentEvent<T = unknown> {
    type: string;
    payload: T;
    timestamp: Date;
    source: string;
}
export interface VoucherCreatedEvent {
    voucherId: string;
    code: string;
    planId: string;
    quantity: number;
}
export interface VoucherActivatedEvent {
    voucherId: string;
    code: string;
    macAddress: string;
    ipAddress?: string;
    hotspotId: string;
}
export interface VoucherExpiredEvent {
    voucherId: string;
    code: string;
    reason: 'expired' | 'maxUsage' | 'manual';
}
export interface SessionStartedEvent {
    sessionId: string;
    voucherId: string;
    hotspotId: string;
    macAddress: string;
}
export interface SessionEndedEvent {
    sessionId: string;
    voucherId: string;
    bytesUp: number;
    bytesDown: number;
    durationSeconds: number;
}
export interface PaymentCompletedEvent {
    paymentId: string;
    voucherId?: string;
    amount: number;
    method: PaymentMethod;
}
export interface PaymentFailedEvent {
    paymentId?: string;
    reason: string;
    method: PaymentMethod;
}
export interface PrintRequestEvent {
    voucherId: string;
    printerName: string;
    copies?: number;
}
export interface PrintSuccessEvent {
    jobId: string;
    voucherId: string;
}
export interface PrintFailedEvent {
    jobId?: string;
    voucherId: string;
    error: string;
}
export interface NotificationSentEvent {
    notificationId: string;
    channel: NotificationChannel;
    userId: string;
}
export interface PredictiveAlertEvent {
    hotspotId: string;
    loadPercent: number;
    activeSessions: number;
    queuedVouchers: number;
}
export interface PredictiveAllocatedEvent {
    hotspotId: string;
    vouchersAllocated: number;
    planId: string;
}
export interface HotspotOfflineEvent {
    hotspotId: string;
    routerIp: string;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}
export interface VoucherGenerationOptions {
    planId: string;
    quantity: number;
    maxUsage?: number;
    prefix?: string;
    length?: number;
    soldByCounterId?: string;
}
export interface PlanInfo {
    id: string;
    name: string;
    description?: string;
    durationHours: number;
    dataLimitMB?: number;
    speedLimitKbps?: number;
    priceRetail: number;
    priceWholesale: number;
}
export interface MikroTikSession {
    id: string;
    user: string;
    address: string;
    macAddress: string;
    uptime: string;
    bytesIn: number;
    bytesOut: number;
    rxRate: number;
    txRate: number;
    server: string;
}
//# sourceMappingURL=index.d.ts.map