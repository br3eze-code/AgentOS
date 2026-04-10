# ClawRouterOS — Architecture & Design Specification

ClawRouterOS is a next-generation modular networking and WiFi billing operating system built on the OpenClaw Agent Framework with Firebase as its state memory. It replaces traditional monolithic routers (like MikroTik RouterOS) with an autonomous, agent-driven, MCP-enabled distributed system.

## 1. System Architecture & Deployment

ClawRouterOS operates in a distributed topology: lightweight Edge Nodes run locally at hotspot locations, while a Central Orchestration Server manages global billing, roaming, and AI operations.

### Deployment Architecture

<SAME_BLANK_LINE>

```mermaid
graph TD
    subgraph Central Orchestration Server (Cloud)
        CA_Bus[Central Event Bus / Redis/NATS]
        DB_C[Central DB: PostgreSQL / Firebase]
        
        Agent_B[Billing & Payment Agents]
        Agent_R[Roaming Agent]
        Agent_AI[AI Operations Agents]
        Agent_M[Marketplace & Skill Registry]
        
        CA_Bus --- Agent_B
        CA_Bus --- Agent_R
        CA_Bus --- Agent_AI
        CA_Bus --- Agent_M
        CA_Bus --- DB_C
    end

    subgraph Edge Hotspot Node A
        EA_Bus[Local Event Bus]
        DB_E[Edge DB: SQLite]
        
        Agent_NW[Networking OS Agents: Firewall, DHCP, Routing]
        Agent_HS[Hotspot & Session Agents]
        
        EA_Bus --- Agent_NW
        EA_Bus --- Agent_HS
        EA_Bus --- DB_E
    end
    
    subgraph Edge Hotspot Node B
        EB_Bus[...]
    end

    Edge Hotspot Node A <==>|Sync & Roaming RPC| Central Orchestration Server
    Edge Hotspot Node B <==>|Sync & Roaming RPC| Central Orchestration Server
```

## 2. Agent Hierarchy and Relationships

Agents communicate exclusively via the Event Bus and expose structured capabilities via the Model Context Protocol (MCP).

| Layer | Agent | Responsibilities |
|-------|-------|------------------|
| **Network OS** | **InterfaceAgent** | Physical/virtual interfaces, bridges, VLANs, tunnels. |
| | **RoutingAgent** | Static/dynamic routing (OSPF, BGP), failover, load balancing. |
| | **FirewallAgent** | NAT, filtering, port forwarding, security policies. |
| | **DHCPAgent** | IP pools, leases, subnets, device MAC spoof detection. |
| | **TrafficAgent** | QoS, bandwidth shaping, queue trees, burst rules. |
| | **DeviceAgent** | Hardware monitoring, firmware, identity, uptime. |
 | **Hotspot/Billing** | **HotspotAgent** | Captive portal, login flows, auth integration. |
| | **RadiusAgent** | Legacy RADIUS auth/accounting compatibility. |
| | **PlanAgent** | Subscription tier management (time/data/speed). |
| | **VoucherAgent** | QR gen, batch codes, redemption logic, expiry. |
| | **SessionAgent** | Connection tracking, limit enforcement, disconnects. |
| | **PaymentAgent** | EcoCash, ZIPIT, Stripe, Wallet, API payment gateways. |
| | **PartnerAgent** | Revenue sharing (e.g., 70% owner / 30% operator), payouts. |
| | **RoamingAgent** | Session migration across nodes, shared auth syncing. |
| **Autonomous AI** | **MonitorAgent** | Metrics collection (latency, users, throughput, health). |
| | **OptimizationAgent** | Auto-adjust channels, load distribution, congestion relief. |
| | **SecurityAgent** | Abuse detection, rogue clients, network fraud, anomaly detection. |
| | **GrowthAgent** | Analyzes trends, suggests new locations, smart pricing. |
| | **ChatOpsAgent** | NLP command parser to MCP tool calls. |

## 3. Database Schema Design (Firebase / Prisma)

Edge nodes use SQLite for offline operation. Central servers use PostgreSQL and Firebase for multi-site orchestration, roaming memory, and synchronization.

```prisma
// Example Core Schema Representation

model HotspotNode {
  id          String   @id @default(uuid())
  macAddress  String   @unique
  location    String
  partnerId   String
  status      String   // ONLINE, OFFLINE
  sessions    Session[]
}

model Voucher {
  id          String   @id @default(uuid())
  code        String   @unique
  planId      String
  status      String   // QUEUED, ACTIVE, USED
  hotspotId   String?  // Which hotspot activated it initially
}

model Session {
  id          String   @id @default(uuid())
  macAddress  String
  ipAddress   String
  voucherCode String   @unique // Linked voucher
  hotspotId   String   // Current node (updates if Roaming)
  bytesInbox  BigInt
  bytesOutbox BigInt
  startedAt   DateTime
  lastSync    DateTime
}

model PartnerRevenue {
  id          String   @id @default(uuid())
  partnerId   String
  amountTotal Float
  payoutSplit Float    // e.g., 0.70 for 70% share to partner
}
```

## 4. Event Bus Specification

Agents react to broadcast events asynchronously via a multi-tier pub/sub bus (Local MQTT for edge, NATS/Redis/Firebase for cloud).

**Standardized Event Format:**

```json
{
  "eventId": "evt_987654321",
  "eventType": "network.user_connected",
  "timestamp": "2026-03-16T21:00:00Z",
  "sourceAgent": "InterfaceAgent",
  "payload": {
    "macAddress": "00:1A:2B:3C:4D:5E",
    "assignedIp": "192.168.10.50",
    "nodeId": "edge_node_harare_01"
  }
}
```

**Example Event Flows:**

- `network.user_connected` -> triggers `SessionAgent` to verify voucher limits -> triggers `FirewallAgent` to lift walled-garden rule -> `IPAssignedEvent`.
- `billing.payment_received` -> triggers `VoucherAgent` to issue code -> triggers `PrinterAgent` to print receipt.
- `roaming.node_transition` -> triggers `RoamingAgent` to invalidate old edge local state and sync new edge state gracefully.

## 5. MCP Tool Specification

All agents expose deterministic tools via the Model Context Protocol (MCP) to allow ChatOps, autonomous workflows, and UI integration.

```json
{
  "tools": [
    {
      "name": "create_plan",
      "description": "Create a new WiFi billing plan",
      "inputSchema": {
        "type": "object",
        "properties": {
          "plan_name": { "type": "string" },
          "price": { "type": "number" },
          "duration_hours": { "type": "integer" },
          "bandwidth_limit_kbps": { "type": "integer" }
        },
        "required": ["plan_name", "price", "duration_hours","macAddress"]
      }
    },
    {
      "name": "generate_vouchers",
      "description": "Generate batch vouchers",
      "inputSchema": {
        "type": "object",
        "properties": {
          "plan_id": { "type": "string" },
          "quantity": { "type": "integer" }
        },
        "required": ["plan_id", "quantity"]
      }
    },
    {
      "name": "disconnect_user",
      "description": "Drop a user's active connection and firewall them",
      "inputSchema": {
        "type": "object",
        "properties": {
          "ip_address": { "type": "string" },
          "reason": { "type": "string" }
        },
        "required": ["ip_address"]
      }
    }
  ]
}
```

## 6. Skill Marketplace & Package Structure

Skills extend the system via standardized NPM-like packages downloaded to the edge or cloud nodes. They bundle agents, MCP tools, and templates.

**Example `wifi_hotspot_skill` Package Structure:**

```text
wifi_hotspot_skill/
├── manifest.yaml          # Name, version, dependencies (e.g., requires FirewallAgent >= 1.2)
├── permissions.json       # MCP permissions required (e.g., ["firewall:write", "session:read"])
├── package.json           # Node.js / NPM dependencies
├── agents/ 
│   └── HotspotAgent.ts    # Agent implementation extending AgentOS Kernel
├── tools/                 
│   └── deploy_portal.ts   # New MCP tools exposed by the skill
└── templates/             # Captive portal HTML/CSS templates
```

**Admin installation command:**

```bash
agentos install @agentclaw/wifi-hotspot-skill
```

## 7. Automation Notebooks (Moltbook Scripts)

Administrators run programmatic Jupyter-like cells that string together MCP tools for automated workflows.

**Example Moltbook Workspace (`launch_promo.molt`):**

```typescript
// Cell 1: Scan and optimize network
const scanResults = await mcp.invoke('MonitorAgent.scan_channels', { freq: "5GHz" });
await mcp.invoke('OptimizationAgent.apply_channel_dist', {
  distribution: scanResults.optimal_map
});

// Cell 2: Create a promo plan
console.log("Deploying $1 promo plan...");
const planId = await mcp.invoke('PlanAgent.create_plan', {
  plan_name: "Weekend Blast",
  price: 1.00,
  duration_hours: 48,
  bandwidth_limit_kbps: 10240
});

// Cell 3: Generate and print vouchers
const vouchers = await mcp.invoke('VoucherAgent.generate_vouchers', {
  plan_id: planId,
  quantity: 50
});

await mcp.invoke('PrinterAgent.print_batch', {
  codes: vouchers.codes,
  printer_id: "mall_printer_01"
});

console.log("Promo successfully deployed across nodes!");
```

## 8. Admin Interfaces & Example CLI Commands

Administrators can use the RouterOS-style CLI, natural language ChatOps, or visual dashboards.

**Example RouterOS-style CLI interactions:**

```bash
# Add a new network bridge
agentos interface bridge add name=br-hotspot

# Configure DHCP pool
agentos dhcp pool add name=dhcp-pool-1 ranges=192.168.10.10-192.168.10.250

# List active sessions remotely via Central Dashboard
agentos roaming sessions print

# Deploy a skill to a specific node
agentos skill deploy @agentclaw/network-anomaly-detection target=edge_node_harare_01
```

**AI ChatOps via CLI (Powered by ChatOpsAgent mapping NLP to MCP):**

```bash
agentos chat "Create a deletable $1 daily WiFi plan"
> Tool invoked: create_plan {"plan_name": "Daily Plan", "price": 1, "duration_hours": 24}
> Success: plan_id 'pl_981' created.

agentos chat "Generate and print 50 qr vouchers for the daily plan"
> Tool invoked: generate_vouchers {"plan_id": "pl_981", "quantity": 50}
> Tool invoked: print_batch {"codes": [...]}
> Success: 50 vouchers printed.

agentos chat "Disconnect device 192.168.1.50"
> Tool invoked: disconnect_user {"ip_address": "192.168.1.50"}
> Success: user disconnected and session closed.
```
