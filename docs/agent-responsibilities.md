# AgentClaw — Agent Responsibilities

## Agent Overview

| Agent | Module | Purpose |
|-------|--------|---------|
| VoucherAgent | @agentclaw/agents | Voucher generation, queuing, activation, expiry |
| HotspotAgent | @agentclaw/agents | MikroTik integration, session sync, magic roaming |
| PaymentAgent | @agentclaw/agents | Cash, wallet, Stripe, EcoCash, ZIPIT processing |
| PrinterAgent | @agentclaw/agents | ESC/POS receipt/voucher printing |
| NotifierAgent | @agentclaw/agents | Email, WhatsApp, push, portal notifications |
| PredictiveAgent | @agentclaw/agents | Load monitoring, pre-allocation, trend analytics |

---

## VoucherAgent

**Responsibilities:**
- Generate alphanumeric voucher codes (configurable prefix + length)
- Queue vouchers in Redis `voucher:queue`
- Activate vouchers: assign MAC/IP, set `validUntil`, create Session record
- Track `usageCount` vs `maxUsage`
- Auto-expire vouchers every 5 minutes via cron
- Validate voucher for magic roaming (with 60s Redis cache)
- Cancel vouchers (manual admin)

**Events Published:** `voucher:created`, `voucher:activated`, `voucher:expired`

**Events Consumed:** `voucher:activate`, `voucher:generate` (from PredictiveAgent)

---

## HotspotAgent

**Responsibilities:**
- Maintain connections to all registered MikroTik routers
- Create `/ip/hotspot/user` entries (with plan profile) on voucher activation
- Remove entries on voucher expiry/cancellation
- Sync active sessions from MikroTik every 30 seconds → update `Session` bytes
- Implement magic roaming: transfer session between hotspots without disconnect
- Monitor hotspot connectivity; mark offline in DB and emit alert on failure

**Events Published:** `session:started`, `session:ended`, `hotspot:offline`, `hotspot:session-count`

**Events Consumed:** `voucher:activated`, `voucher:expired`

---

## PaymentAgent

**Responsibilities:**
- Process CASH payments (POS counter — immediate, no external call)
- Process WALLET payments (deduct from cashier/partner wallet)
- Process STRIPE charges via PaymentIntent API
- Stub EcoCash + ZIPIT with pending payment records
- Wallet top-up and balance retrieval (with Redis caching)
- Sales report aggregation by counter, method, and date range

**Events Published:** `payment:completed`, `payment:failed`

---

## PrinterAgent

**Responsibilities:**
- Build ESC/POS binary receipts with QR codes for voucher codes
- Send to network printers via TCP (port 9100) or USB
- Auto-print on `payment:completed` event
- Support re-print on demand (by voucher code)
- Log print job status to Redis and `PrintJob` DB table

**Events Published:** `print:success`, `print:failed`

**Events Consumed:** `print:request`, `payment:completed`

---

## NotifierAgent

**Responsibilities:**
- Send email via Nodemailer (SMTP)
- Send WhatsApp messages via Meta Business Cloud API
- Send Firebase push notifications
- Record portal (in-app) notifications in `Notification` table
- Auto-notify users on voucher activation and expiry
- Handle WhatsApp webhook verification

**Events Published:** `notification:sent`, `notification:failed`

**Events Consumed:** `voucher:activated`, `voucher:expired`

---

## PredictiveAgent

**Responsibilities:**
- Poll all online hotspots for active session counts (configurable interval: default 5 min)
- Calculate load % per hotspot (activeSessions / maxCapacity)
- Cache stats in Redis with 10-minute TTL
- Emit `predictive:alert` when load ≥ threshold (default 80%)
- Auto-pre-allocate vouchers when queue drops below 10 for a high-load hotspot
- Log all observations to `PredictiveLog` table
- Provide load trend data for last N hours + dashboard summary

**Events Published:** `predictive:alert`, `predictive:allocated`, `predictive:low-stock`

**Events Consumed:** `hotspot:session-count`
