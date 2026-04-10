# AgentClaw — API Routes Reference

Base URL: `http://localhost:4000`

## Authentication

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | None | Login, returns JWT |
| POST | `/api/auth/register` | None | Register new user |
| GET | `/api/auth/me` | Bearer | Get current user |

## Vouchers

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/vouchers` | Bearer | List vouchers (filter by status, planId) |
| POST | `/api/vouchers/generate` | ADMIN/PARTNER/CASHIER | Generate batch of vouchers |
| POST | `/api/vouchers/activate` | None | Activate a voucher (QR scan/manual) |
| GET | `/api/vouchers/:code/validate` | None | Validate for magic roaming |
| DELETE | `/api/vouchers/:id` | ADMIN | Cancel a voucher |
| POST | `/api/vouchers/reprint` | ADMIN/CASHIER | Queue reprint job |

## Plans

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/plans` | None | List active plans |
| POST | `/api/plans` | ADMIN | Create plan |
| PUT | `/api/plans/:id` | ADMIN | Update plan |
| DELETE | `/api/plans/:id` | ADMIN | Deactivate plan |

## Hotspots

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/hotspots` | Bearer | List hotspots |
| POST | `/api/hotspots` | ADMIN | Add hotspot |
| GET | `/api/hotspots/:id/status` | Bearer | Status + session count |
| GET | `/api/hotspots/:id/sessions` | Bearer | Active sessions on hotspot |
| POST | `/api/hotspots/roam` | None | Magic roaming trigger |
| POST | `/api/hotspots/:id/command` | ADMIN | Raw RouterOS command passthrough |

## POS

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/pos/checkout` | CASHIER/ADMIN | Full POS checkout flow |
| GET | `/api/pos/sales-report` | CASHIER/PARTNER/ADMIN | Sales report |
| GET | `/api/pos/queue-length` | Bearer | Redis queue length |

## Payments

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/payments/stripe` | None | Stripe payment |
| POST | `/api/payments/ecocash` | None | EcoCash payment |
| POST | `/api/payments/zipit` | None | ZIPIT payment |
| POST | `/api/payments/wallet/topup` | ADMIN/PARTNER | Top up wallet |
| GET | `/api/payments/wallet/:id/balance` | Bearer | Wallet balance |

## Partner

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/partner/counters` | PARTNER/ADMIN | List partner's counters |
| GET | `/api/partner/wallet` | PARTNER/ADMIN | Wallet balance |
| GET | `/api/partner/report` | PARTNER/ADMIN | 30-day sales report |
| GET | `/api/partner/predictive` | PARTNER/ADMIN | Predictive dashboard summary |

## Admin

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/dashboard` | ADMIN | Full system dashboard |
| GET | `/api/admin/users` | ADMIN | List all users |
| POST | `/api/admin/users` | ADMIN | Create user (any role) |
| DELETE | `/api/admin/users/:id` | ADMIN | Delete user |
| GET | `/api/admin/sessions` | ADMIN | All active sessions |
| POST | `/api/admin/hotspots/:id/sync` | ADMIN | Force session sync |
| POST | `/api/admin/predictive/analyze` | ADMIN | Trigger predictive analysis |

## Notifications

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/notifications` | Bearer | User notifications |
| POST | `/api/notifications/send` | Bearer | Send notification |

## Webhooks

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/webhooks/stripe` | Signed | Stripe event handler |
| GET | `/api/webhooks/whatsapp` | Query | Meta webhook verification |
| POST | `/api/webhooks/whatsapp` | None | Incoming WhatsApp messages |

## Health

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Kernel status + agent registry |

## Magic Roaming Endpoint (PHP-compatible)

Used by MikroTik walled garden login page:
```
GET /api/vouchers/:code/validate
→ { valid: true, voucher: { id, code, planName, validUntil, macAddress, hotspotId } }
```

```
POST /api/hotspots/roam
Body: { code, newHotspotId, macAddress }
→ { success: true, message: "Roamed successfully" }
```
