# AgentClaw — Setup & Getting Started

## Prerequisites

- Node.js >= 18
- MySQL 8
- Redis 7
- MikroTik router (optional for testing without hardware)

## Quick Start

### 1. Clone and Install

```bash
cd C:\Users\user\Downloads\agentos
npm install
```

### 2. Configure Environment

```bash
copy .env.example .env
# Edit .env with your credentials
```

Minimum required configuration:

```env
DATABASE_URL="mysql://root:your_password@localhost:3306/agentclaw"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-long-random-secret-at-least-32-chars"
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates all tables)
cd packages/db
npx prisma migrate dev --name init

# Seed with demo data
npm run db:seed
```

**Seed credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | <admin@agentclaw.com> | admin123 |
| Partner | <partner@agentclaw.com> | partner123 |
| Cashier | <cashier@agentclaw.com> | cashier123 |

### 4. Start the API Server

```bash
cd packages/api
npm run dev
# → API running on http://localhost:4000
```

### 5. Start the POS Dashboard

```bash
cd packages/pos-dashboard
npm run dev
# → Dashboard at http://localhost:3000
```

Login at `http://localhost:3000` with cashier credentials.

### 6. Start the E-Commerce Store

```bash
cd packages/ecommerce
npm run dev
# → Store at http://localhost:3001
```

### 7. Use the CLI

```bash
# Build CLI first
cd packages/cli && npm run build

# Then use it
node dist/index.js --help
node dist/index.js admin dashboard --token <JWT>
node dist/index.js admin voucher generate --plan plan-1h --qty 10 --token <JWT>
node dist/index.js cashier sell --plan plan-1h --qty 2 --payment CASH --token <JWT>
```

## Development — All Services

```bash
# From root, start all in parallel
npm run dev
```

## Database Inspection

```bash
npm run db:studio
# → Opens Prisma Studio at http://localhost:5555
```

## MikroTik Setup

1. Add hotspot via API:

```bash
curl -X POST http://localhost:4000/api/hotspots \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Hotspot",
    "routerIp": "192.168.88.1",
    "apiPort": 8728,
    "apiUser": "admin",
    "apiPassword": "admin123",
    "location": "Ground Floor"
  }'
```

1. Configure MikroTik walled garden to redirect to:
   `http://your-server:4000/api/vouchers/activate`

2. For magic roaming, add all hotspots to DB and point their login pages to the same API.

## RADIUS (Optional)

The RADIUS adapter listens on UDP 1812. To enable:

```typescript
import { RadiusAdapter } from '@agentclaw/mikrotik';
const radius = new RadiusAdapter(1812, process.env.RADIUS_SECRET);
radius.start();
```

Configure MikroTik to use `your-server-ip:1812` as RADIUS server with the same secret.

## Stripe Testing

Use Stripe test key `sk_test_...` and card `4242 4242 4242 4242`.

## WhatsApp

1. Set up a Meta Business Cloud API app
2. Add phone number ID and token to `.env`
3. Set webhook URL to `https://your-domain/api/webhooks/whatsapp`
4. Use `WHATSAPP_VERIFY_TOKEN` in `.env` for webhook verification

## Architecture Docs

See [docs/architecture.md](./architecture.md) for the full system diagram.
See [docs/api-routes.md](./api-routes.md) for all API endpoints.
See [docs/voucher-lifecycle.md](./voucher-lifecycle.md) for Mermaid flow diagrams.
