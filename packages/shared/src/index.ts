// ============================================================
// Shared Types for AgentOS Ecosystem
// ============================================================

export type Role = 'ADMIN' | 'PARTNER' | 'CASHIER' | 'USER';

export type VoucherStatus = 'QUEUED' | 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'WALLET' | 'STRIPE' | 'ECOCASH' | 'ZIPIT';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'PUSH' | 'PORTAL';

export type SessionStatus = 'ACTIVE' | 'ENDED' | 'ROAMED';

export type PrintJobStatus = 'QUEUED' | 'PRINTING' | 'DONE' | 'FAILED';

// ============================================================
// Core Event Types (Event Bus)
// ============================================================

export interface AgentEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
  source: string;
}

// Voucher Events
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

// Session Events
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

// Payment Events
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

// Print Events
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

// Notification Events
export interface NotificationSentEvent {
  notificationId: string;
  channel: NotificationChannel;
  userId: string;
}

// Predictive Events
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

// Hotspot Events
export interface HotspotOfflineEvent {
  hotspotId: string;
  routerIp: string;
}

// ============================================================
// API Response Types
// ============================================================

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

// ============================================================
// Voucher Generation Config
// ============================================================

export interface VoucherGenerationOptions {
  planId: string;
  quantity: number;
  maxUsage?: number;
  prefix?: string;
  length?: number;
  soldByCounterId?: string;
}

// ============================================================
// Plan Info
// ============================================================

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

// ============================================================
// Session Info (from MikroTik)
// ============================================================

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

// ============================================================
// Model Context Protocol (MCP) Types
// ============================================================

export interface MCPToolInputSchema {
  type: 'object';
  properties: Record<string, { type: string; enum?: string[]; description?: string }>;
  required?: string[];
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: MCPToolInputSchema;
}

export interface MCPToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}
