# AgentClaw — Voucher Lifecycle

## States

```
QUEUED → ACTIVE → USED
                ↘
                EXPIRED
QUEUED → CANCELLED
```

## State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> QUEUED: VoucherAgent.generate()
    QUEUED --> ACTIVE: activate() via QR/manual
    QUEUED --> CANCELLED: admin cancel
    ACTIVE --> USED: usageCount >= maxUsage
    ACTIVE --> EXPIRED: validUntil < now
    ACTIVE --> ACTIVE: magic roam (hotspot change)
    USED --> [*]
    EXPIRED --> [*]
    CANCELLED --> [*]
```

## End-to-End Voucher Flow

```mermaid
sequenceDiagram
    participant Admin/Cashier
    participant VoucherAgent
    participant Redis
    participant DB
    participant MikroTik
    participant User
    participant NotifierAgent
    participant PrinterAgent

    Admin/Cashier->>VoucherAgent: generate(planId, qty)
    VoucherAgent->>DB: INSERT voucher (QUEUED)
    VoucherAgent->>Redis: lpush voucher:queue
    VoucherAgent->>PrinterAgent: print:request event

    PrinterAgent->>PrinterAgent: Build ESC/POS receipt
    PrinterAgent->>MikroTik: TCP print (port 9100)

    User->>MikroTik: Connect to WiFi
    MikroTik->>API: POST /api/vouchers/activate (code, MAC, hotspotId)
    API->>VoucherAgent: activateVoucher()
    VoucherAgent->>DB: UPDATE ACTIVE + MAC + validUntil
    VoucherAgent->>DB: INSERT session
    VoucherAgent->>Redis: cacheSession(mac)
    VoucherAgent->>HotspotAgent: voucher:activated event
    HotspotAgent->>MikroTik: /ip/hotspot/user/add
    HotspotAgent-->>User: Internet access granted

    NotifierAgent->>User: Email + WhatsApp confirmation

    loop Every 30s
        HotspotAgent->>MikroTik: /ip/hotspot/active/print
        HotspotAgent->>DB: UPDATE session bytes
    end

    VoucherAgent->>VoucherAgent: cron every 5min
    VoucherAgent->>DB: Expire stale vouchers
    HotspotAgent->>MikroTik: /ip/hotspot/user/remove
    NotifierAgent->>User: Session ended notification
```

## Magic Roaming Flow

```mermaid
sequenceDiagram
    participant User
    participant NewHotspot as New Hotspot
    participant API
    participant HotspotAgent
    participant OldHotspot as Old Hotspot
    participant DB

    User->>NewHotspot: Connect, enter voucher code
    NewHotspot->>API: POST /api/hotspots/roam {code, newHotspotId, mac}
    API->>HotspotAgent: handleRoaming()
    HotspotAgent->>DB: Check current hotspot (oldHotspotId)
    HotspotAgent->>OldHotspot: /ip/hotspot/user/remove (code)
    HotspotAgent->>DB: UPDATE session → ROAMED
    HotspotAgent->>DB: UPDATE voucher.hotspotId = newHotspotId
    HotspotAgent->>NewHotspot: /ip/hotspot/user/add (code, mac, plan)
    HotspotAgent->>DB: INSERT new session
    HotspotAgent->>Redis: cacheSession(mac, newHotspotId)
    HotspotAgent-->>User: ✅ Seamlessly connected
```

## POS vs Online Sale — Transaction Path

```mermaid
flowchart TD
    subgraph POS["POS Sale (Physical)"]
        C[Cashier selects plan + qty] --> P[POST /api/pos/checkout]
        P --> G[VoucherAgent.generate]
        G --> PAY[PaymentAgent.processCash or processWallet]
        PAY --> PRINT[PrinterAgent.printVoucher]
        PRINT --> RECEIPT[ESC/POS receipt with QR]
    end

    subgraph ONLINE["Online Sale (E-Commerce)"]
        U[User adds to cart] --> CHK[POST /api/payments/stripe]
        CHK --> STRIPE[Stripe PaymentIntent]
        STRIPE --> WH[Stripe Webhook → payment_intent.succeeded]
        WH --> G2[VoucherAgent.generate]
        G2 --> EMAIL[NotifierAgent.sendEmail with code]
        G2 --> WA[NotifierAgent.sendWhatsApp]
    end

    subgraph ACTIVATION["Voucher Activation"]
        QR[User scans QR] --> ACT[POST /api/vouchers/activate]
        ACT --> VA[VoucherAgent.activateVoucher]
        VA --> MT[HotspotAgent → MikroTik user/add]
        MT --> SESSION[Session created in DB + Redis]
    end
```
