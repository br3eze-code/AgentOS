"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kernel_1 = require("@agentclaw/kernel");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function main() {
    console.log('🌱 Seeding AgentOS Firebase database...');
    (0, kernel_1.initFirebase)();
    const db = (0, kernel_1.getFirestore)();
    // ---- Admin User ----
    const adminHash = await bcryptjs_1.default.hash('admin123', 12);
    const adminRef = db.collection('users').doc('admin@agentclaw.com');
    await adminRef.set({
        name: 'Super Admin',
        email: 'admin@agentclaw.com',
        passwordHash: adminHash,
        role: 'ADMIN',
        phone: '+263771000000',
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    console.log(`✓ Admin user: admin@agentclaw.com`);
    // ---- Partner User ----
    const partnerHash = await bcryptjs_1.default.hash('partner123', 12);
    const partnerUserRef = db.collection('users').doc('partner@agentclaw.com');
    await partnerUserRef.set({
        name: 'Main Partner',
        email: 'partner@agentclaw.com',
        passwordHash: partnerHash,
        role: 'PARTNER',
        phone: '+263772000001',
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    const partnerRef = db.collection('partners').doc('partner-main-001');
    await partnerRef.set({
        userId: 'partner@agentclaw.com',
        shopName: 'Main Hotspot Shop',
        address: '123 Main St, Harare',
        revenueSplit: 0.70,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    const walletRef = db.collection('wallets').doc('wallet-partner-001');
    await walletRef.set({
        ownerId: 'partner-main-001',
        ownerType: 'PARTNER',
        balance: 500.0,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    console.log(`✓ Partner: partner@agentclaw.com ($500 wallet)`);
    // ---- Plans ----
    const plans = [
        { id: 'plan-1h', name: '1 Hour', description: 'Browse for 1 hour', durationHours: 1, dataLimitMB: 500, speedLimitKbps: 2048, priceRetail: 0.50, pricePartner: 0.35, active: true },
        { id: 'plan-3h', name: '3 Hours', description: 'Browse for 3 hours', durationHours: 3, dataLimitMB: 2048, speedLimitKbps: 4096, priceRetail: 1.00, pricePartner: 0.70, active: true },
        { id: 'plan-day', name: '1 Day', description: 'Full day access', durationHours: 24, dataLimitMB: null, speedLimitKbps: 5120, priceRetail: 3.00, pricePartner: 2.00, active: true },
    ];
    for (const p of plans) {
        await db.collection('plans').doc(p.id).set({
            ...p,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log(`✓ Plan: ${p.name} ($${p.priceRetail})`);
    }
    // ---- Demo Hotspot ----
    const hotspotRef = db.collection('hotspots').doc('hotspot-main-001');
    await hotspotRef.set({
        name: 'Main Hotspot',
        routerIp: '192.168.88.1',
        apiPort: 8728,
        apiUser: 'admin',
        apiPassword: '',
        location: 'Main Building',
        partnerId: 'partner-main-001',
        status: 'ONLINE',
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    console.log(`✓ Hotspot: Main Hotspot @ 192.168.88.1`);
    // ---- Sample Vouchers ----
    const sampleCodes = ['DEMO-AAAA1111', 'DEMO-BBBB2222'];
    for (const code of sampleCodes) {
        await db.collection('vouchers').doc(code).set({
            code,
            planId: 'plan-1h',
            status: 'QUEUED',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    console.log(`✓ Sample vouchers: ${sampleCodes.join(', ')}`);
    console.log('\n🎉 Firebase Seed complete!');
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map