"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding AgentOS database...');
    // ---- Admin User ----
    const adminHash = await bcryptjs_1.default.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@agentclaw.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'admin@agentclaw.com',
            passwordHash: adminHash,
            role: 'ADMIN',
            phone: '+263771000000',
        },
    });
    console.log(`✓ Admin user: ${admin.email}`);
    // ---- Partner User ----
    const partnerHash = await bcryptjs_1.default.hash('partner123', 12);
    const partnerUser = await prisma.user.upsert({
        where: { email: 'partner@agentclaw.com' },
        update: {},
        create: {
            name: 'Main Partner',
            email: 'partner@agentclaw.com',
            passwordHash: partnerHash,
            role: 'PARTNER',
            phone: '+263772000001',
        },
    });
    const partner = await prisma.partner.upsert({
        where: { userId: partnerUser.id },
        update: {},
        create: { userId: partnerUser.id, shopName: 'Main Hotspot Shop', address: '123 Main St, Harare' },
    });
    await prisma.wallet.upsert({
        where: { partnerId: partner.id },
        update: {},
        create: { partnerId: partner.id, balance: 500.0, currency: 'USD' },
    });
    console.log(`✓ Partner: ${partnerUser.email} ($500 wallet)`);
    // ---- Counter ----
    const counter = await prisma.counter.upsert({
        where: { id: 'counter-main-001' },
        update: {},
        create: { id: 'counter-main-001', partnerId: partner.id, name: 'Counter 1 - Main', location: 'Ground Floor' },
    });
    console.log(`✓ Counter: ${counter.name}`);
    // ---- Cashier User ----
    const cashierHash = await bcryptjs_1.default.hash('cashier123', 12);
    const cashierUser = await prisma.user.upsert({
        where: { email: 'cashier@agentclaw.com' },
        update: {},
        create: {
            name: 'Front Cashier',
            email: 'cashier@agentclaw.com',
            passwordHash: cashierHash,
            role: 'CASHIER',
            phone: '+263773000002',
        },
    });
    const cashier = await prisma.cashier.upsert({
        where: { userId: cashierUser.id },
        update: {},
        create: { userId: cashierUser.id, counterId: counter.id },
    });
    await prisma.wallet.upsert({
        where: { cashierId: cashier.id },
        update: {},
        create: { cashierId: cashier.id, balance: 100.0, currency: 'USD' },
    });
    console.log(`✓ Cashier: ${cashierUser.email} ($100 wallet)`);
    // ---- Plans ----
    const plans = [
        { id: 'plan-1h', name: '1 Hour', description: 'Browse for 1 hour', durationHours: 1, dataLimitMB: 500, speedLimitKbps: 2048, priceRetail: 0.50, priceWholesale: 0.35 },
        { id: 'plan-3h', name: '3 Hours', description: 'Browse for 3 hours', durationHours: 3, dataLimitMB: 2048, speedLimitKbps: 4096, priceRetail: 1.00, priceWholesale: 0.70 },
        { id: 'plan-day', name: '1 Day', description: 'Full day access', durationHours: 24, dataLimitMB: null, speedLimitKbps: 5120, priceRetail: 3.00, priceWholesale: 2.00 },
        { id: 'plan-week', name: '1 Week', description: 'Weekly unlimited', durationHours: 168, dataLimitMB: null, speedLimitKbps: 10240, priceRetail: 10.00, priceWholesale: 7.00 },
        { id: 'plan-month', name: '1 Month', description: 'Monthly plan', durationHours: 720, dataLimitMB: null, speedLimitKbps: null, priceRetail: 30.00, priceWholesale: 22.00 },
    ];
    for (const p of plans) {
        await prisma.plan.upsert({ where: { id: p.id }, update: {}, create: p });
        console.log(`✓ Plan: ${p.name} ($${p.priceRetail})`);
    }
    // ---- Demo Hotspot ----
    const hotspot = await prisma.hotspot.upsert({
        where: { id: 'hotspot-main-001' },
        update: {},
        create: {
            id: 'hotspot-main-001',
            name: 'Main Hotspot',
            routerIp: '192.168.88.1',
            apiPort: 8728,
            apiUser: 'admin',
            apiPassword: '',
            location: 'Main Building',
            isOnline: false,
        },
    });
    console.log(`✓ Hotspot: ${hotspot.name} @ ${hotspot.routerIp}`);
    // ---- Sample Vouchers ----
    const sampleCodes = ['DEMO-AAAA1111', 'DEMO-BBBB2222', 'DEMO-CCCC3333'];
    for (const code of sampleCodes) {
        await prisma.voucher.upsert({
            where: { code },
            update: {},
            create: { code, planId: 'plan-1h', status: 'QUEUED', maxUsage: 1 },
        });
    }
    console.log(`✓ Sample vouchers: ${sampleCodes.join(', ')}`);
    console.log('\n🎉 Seed complete!');
    console.log('   Admin:   admin@agentclaw.com / admin123');
    console.log('   Partner: partner@agentclaw.com / partner123');
    console.log('   Cashier: cashier@agentclaw.com / cashier123');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map