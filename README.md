<div align="center">

```
 █████╗  ██████╗ ███████╗███╗   ██╗████████╗ ██████╗ ███████╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██╔═══██╗██╔════╝
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ██║   ██║███████╗
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██║   ██║╚════██║
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ╚██████╔╝███████║
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚══════╝
```

**Network Intelligence Platform — v2026.5.2**  
*AI-powered MikroTik management via Telegram, WhatsApp & CLI*

[![Version](https://img.shields.io/badge/AgentOS-2026.5.2-00d4ff?style=for-the-badge&logo=router&logoColor=white)](https://github.com/br3eze-code/AgentOS)
[![MikroTik](https://img.shields.io/badge/MikroTik-RouterOS-ff6b00?style=for-the-badge&logo=mikrotik)](https://mikrotik.com)
[![AI](https://img.shields.io/badge/AI-Gemini_2.5-ff9500?style=for-the-badge&logo=google)](https://deepmind.google/gemini)
[![License](https://img.shields.io/badge/License-Apache_2.0-00ff9f?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-ESM-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Stars](https://img.shields.io/github/stars/br3eze-code/br3eze-code?style=for-the-badge&color=ffd700)](https://github.com/br3eze-code/br3eze-code/stargazers)

[**Docs**](docs/) · [**Quick Start**](#quick-start) · [**CLI Reference**](#cli-reference) · [**Architecture**](#architecture) · [**Contributing**](CONTRIBUTING.md)

</div>

---

## The Problem AgentOS Solves

Managing community WiFi infrastructure across multiple MikroTik nodes is painful. WinBox requires a desktop. RouterOS CLI requires memorizing commands. Hotspot billing requires manual voucher generation. Payment collection is disconnected from provisioning.

AgentOS collapses this into **one intelligent agent** you control from Telegram.

```
Before AgentOS:                    After AgentOS:
─────────────────                  ──────────────
Open WinBox          ──┐           Send "kick john"
Navigate menus         │    →      ✅ Done in 2 seconds
Find user              │
Right-click → Kick   ──┘
```

---

## Features

### 🤖 AI Coordinator
- Natural language router management via **Gemini 2.5 Flash**
- ReAct reasoning engine with 5-turn depth
- Context-aware command suggestions and error recovery
- AgentMemory for persistent session state

### 💬 Multi-Channel Control
| Channel | Status | Notes |
|---------|--------|-------|
| Telegram Bot | ✅ Production | Inline keyboards, button menus |
| WhatsApp | ✅ Production | Baileys-powered, no Meta API needed |
| WebSocket CLI | ✅ Production | Browser terminal experience |
| REST API | ✅ Production | Programmatic/webhook access |
| RouterOS Native | ✅ Production | On-device Sentinel agent (`.rsc`) |

### 🎫 Voucher & Billing System
- Automated WiFi voucher generation (1Day/1GB · 7Day/7GB · 30Day/30GB)
- **Mastercard Account-to-Account (A2A)** payment integration via OAuth 1.0a RSA-SHA256
- QR code generation for voucher redemption
- Wallet-based voucher storage with Firebase sync
- Dual-limit expiry: time-based OR data quota (`limit-bytes-total`), whichever comes first

### 🌐 Network Management
- Multi-router mesh — manage multiple MikroTik nodes from one gateway
- Real-time DHCP/hotspot user monitoring
- Firewall rule management
- Ping, traceroute, bandwidth stats
- Automated alerts via Telegram on threshold breach

### 🔒 Security
- CVE-2026-1526 patched
- Command allowlist (no arbitrary RCE via Telegram)
- HTTPS certificate validation on all outbound calls
- Tiered permission policy (admin / operator / readonly)
- Rate limiting + Joi input validation on all REST endpoints
- Audit trail for all router operations

---

## Quick Start

### Prerequisites
- Node.js 20+ (ESM)
- MikroTik RouterOS 7.x
- Telegram Bot Token (from @BotFather)
- Google Gemini API Key
- Firebase project (or use local JSON fallback)

### Installation

```bash
# Clone
git clone https://github.com/br3eze-code/br3eze-code.git
cd br3eze-code

# Install dependencies
npm install

# Interactive setup wizard
npm run onboard

# Or manual config
cp .env.example .env
nano .env
```

### Environment Variables

```env
# MikroTik
MIKROTIK_HOST=192.168.88.1
MIKROTIK_USER=admin
MIKROTIK_PASS=your_password
MIKROTIK_PORT=8728

# Telegram
TELEGRAM_TOKEN=your_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id

# AI
GEMINI_API_KEY=your_gemini_key

# Payments (Mastercard A2A)
MC_CONSUMER_KEY=your_key
MC_PRIVATE_KEY_PATH=./certs/sandbox.p12

# Database
FIREBASE_PROJECT_ID=your_project
# Or leave blank for local JSON fallback
```

### Running

```bash
# Foreground (development)
npm start

# Daemon mode (production)
agentos gateway --daemon

# Health check
agentos doctor

# RouterOS Sentinel (deploy to router)
# Upload agentos-sentinel.rsc to your MikroTik
# /import file-name=agentos-sentinel.rsc
```

---

## CLI Reference

```
agentos
├── onboard                   Interactive setup wizard
├── gateway                   WebSocket + Telegram gateway
│   ├── --daemon              Run as background service
│   ├── --force               Kill existing process first
│   └── gateway:stop          Graceful shutdown
├── status (s)                System overview
├── doctor [--fix]            Health check + auto-repair
│
├── network (net)
│   ├── ping <host>           ICMP ping via router
│   ├── scan                  DHCP lease scan
│   ├── firewall              List firewall rules
│   ├── block <ip|mac>        Add drop rule
│   └── unblock <ip|mac>      Remove drop rule
│
├── users (user)
│   ├── list [--all]          Active / all hotspot users
│   ├── kick <username>       Disconnect user
│   ├── add <username>        Create hotspot user
│   ├── remove <username>     Delete user
│   └── status <username>     Check online + usage
│
├── voucher (v)
│   ├── create [plan]         Generate voucher (1Day|7Day|30Day)
│   ├── list                  Recent vouchers
│   ├── revoke <code>         Delete unused voucher
│   └── stats                 Revenue + usage stats
│
└── config
    ├── get <path>            Read config value
    ├── set <path> <value>    Write config value
    ├── edit                  Open in $EDITOR
    └── show                  Display full config
```

### Telegram Commands

```
/start      Authenticate and show menu
/status     Router status overview
/users      Active user list with kick buttons
/kick       Kick a user by name
/voucher    Create voucher with plan selector
/stats      Network + billing stats
/ping       Ping a host
/firewall   Show firewall rules
/help       Full command list
```

---

## Architecture

```
                    ┌──────────────────────────────────┐
                    │         Inbound Channels          │
                    │  Telegram │ WhatsApp │ REST │ WS  │
                    └────────────────┬─────────────────┘
                                     │
                    ┌────────────────▼─────────────────┐
                    │           AgentOS Core            │
                    │  ┌──────────────────────────────┐ │
                    │  │     AskEngine (ReAct Loop)   │ │
                    │  │     Gemini 2.5 Flash · 5T    │ │
                    │  └──────────────┬───────────────┘ │
                    │  ┌─────────────▼───────────────┐  │
                    │  │  AgentMemory │ NodeRegistry  │  │
                    │  │  SkillRegistry │ HookRegistry│  │
                    │  └─────────────┬───────────────┘  │
                    └────────────────┼─────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                       │
   ┌──────────▼──────────┐  ┌───────▼────────┐  ┌──────────▼────────┐
   │   MikroTik Manager  │  │    Database    │  │  Payment Gateway  │
   │  routeros-client    │  │  Firebase /    │  │  Mastercard A2A   │
   │  RouterOS API v7    │  │  Local JSON    │  │  OAuth 1.0a RSA   │
   └──────────┬──────────┘  └───────┬────────┘  └───────────────────┘
              │                     │
   ┌──────────▼──────────┐  ┌───────▼────────┐
   │   MikroTik Router   │  │   Firestore    │
   │   192.168.88.1      │  │   Collections  │
   │   + Sentinel .rsc   │  └────────────────┘
   └─────────────────────┘
```

### Key Subsystems

| Module | File | Role |
|--------|------|------|
| Core Engine | `agentos.mjs` | Entry point, boot sequence |
| Gateway | `server/gateway.js` | WebSocket + HTTP server |
| MikroTik Manager | `src/core/mikrotik.js` | RouterOS API adapter |
| AI Engine | `agents/ask-engine.js` | Gemini ReAct loop |
| Billing | `services/billing.js` | Voucher + payment flow |
| Sentinel | `agentos-sentinel.rsc` | On-router native agent |
| CLI | `bin/agentos.js` | Commander.js entry |

---

## Billing Plans

| Plan | Duration | Data Quota | Expires On |
|------|----------|------------|------------|
| 1Day | 24 hours | 10 GB | Time OR quota (first) |
| 7Day | 7 days | 21 GB | Time OR quota (first) |
| 30Day | 30 days | 60 GB | Time OR quota (first) |

Payment flow: **Mastercard A2A → Firebase → Voucher Generation → MikroTik Hotspot User**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 ESM |
| Router API | MikroTik RouterOS Client v7 |
| AI Engine | Google Gemini 2.5 Flash |
| Messaging | node-telegram-bot-api + Baileys (WhatsApp) |
| Payments | Mastercard A2A · OAuth 1.0a RSA-SHA256 |
| Database | Firebase Firestore / Local JSON |
| Gateway | WebSocket (ws) + Express |
| CLI | Commander.js |
| Mobile | Apache Cordova (Android/iOS/PWA) |
| Security | Helmet · Rate-limit · Joi |
| Logging | Winston |

---

## Deployment

### Docker

```bash
docker compose up -d
```

### Podman

```bash
cp agentos.podman.env .env
podman play kube agentos.yaml
```

### Manual (Linux systemd)

```bash
./install.sh
systemctl enable agentos
systemctl start agentos
```

### RouterOS Sentinel

```routeros
# Upload via WinBox Files or SCP, then:
/import file-name=agentos-sentinel.rsc
# Verify
/system/scheduler print
```

---

## Repository Structure

```
agentos/
├── agentos.mjs              Main entry (ESM)
├── agentos-sentinel.rsc     RouterOS native agent
├── agentos-sentinel.rsc                RouterOS bootstrap scripts
├── bin/agentos.js           CLI entry point
├── src/
│   ├── core/
│   │   ├── mikrotik.js      RouterOS manager
│   │   ├── gateway.js       WebSocket server
│   │   ├── database.js      Firebase/local DB
│   │   └── logger.js        Winston logger
│   └── cli/
│       ├── program.js       Commander setup
│       └── commands/        CLI subcommands
├── agents/                  AI agent modules
├── services/                Billing, voucher, payment
├── adapters/                Channel adapters (TG, WA)
├── skills/                  Agent skill definitions
├── workflows/               Automation workflows
├── apps/shared/AgentOSkit/  Shared SDK
├── custom-plugins/          Cordova plugin: aicore
├── vscode-extension/        VS Code extension
├── www/                     Web UI (cyberpunk portal)
├── docs/                    Documentation
├── tests/                   Test suites
└── scripts/                 Deployment scripts
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

**Quick ways to contribute:**
- ⭐ Star the repo
- 🐛 [Open an issue](https://github.com/br3eze-code/AgentOS/issues)
- 💡 [Start a discussion](https://github.com/br3eze-code/AgentOS/discussions)
- 🔧 Submit a PR tagged `good-first-issue`

---

## License

Apache 2.0 © 2026 Brighton Mzacana · [br3eze.africa](https://br3eze.africa)

---

<div align="center">
<sub>Built for Africa's community networks · Powered by AI · Controlled via Telegram</sub>
</div>
