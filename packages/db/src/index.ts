export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'PARTNER' | 'CASHIER';
  partnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Partner {
  id: string;
  name: string;
  revenueSplit: number; // e.g. 0.70
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  durationHours: number;
  dataLimitMB: number | null;
  speedLimitKbps: number | null;
  priceRetail: number;
  pricePartner: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Voucher {
  id: string;
  code: string;
  planId: string;
  status: 'QUEUED' | 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  macAddress?: string;
  ipAddress?: string;
  hotspotId?: string;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  voucherCode: string;
  macAddress: string;
  ipAddress: string;
  hotspotId: string;
  bytesIn: number;
  bytesOut: number;
  startedAt: Date;
  lastSync: Date;
}

export interface Hotspot {
  id: string;
  name: string;
  routerIp: string;
  apiPort: number;
  apiUser: string;
  apiPassword?: string;
  location: string;
  partnerId?: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrintJob {
  id: string;
  voucherId: string;
  printerName: string;
  status: 'QUEUED' | 'PRINTING' | 'DONE' | 'FAILED';
  attempts: number;
  errorMsg?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Emulate Prisma's getPrisma behavior loosely to slowly refactor the codebase to Firestore
import { getFirestore } from '@agentclaw/kernel';

export const dbHelpers = {
  getVoucher: async (id: string): Promise<Voucher | null> => {
    const doc = await getFirestore().collection('vouchers').doc(id).get();
    return doc.exists ? (doc.data() as Voucher) : null;
  },
  // Add other helpers as needed
};
