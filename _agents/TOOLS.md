# Tool Usage Conventions (TOOLS.md)

## GENERAL CONVENTIONS
- Always log the tool start and duration.
- Prefix all tool outputs with the agent name in brackets (e.g., `[HotspotAgent]`).
- Use `MemoryManager` to cache long-running tool results to avoid redundant hardware calls.

## AGENT SPECIFIC CONVENTIONS

### HotspotAgent
- Before `deploy_hotspot`, verify the `routerIp` is reachable using a ping tool (to be implemented).
- Apply data limits immediately after a successful `captive_portal_login`.

### SessionAgent
- Use MAC address as the primary identifier for hardware kicking to avoid issues with dynamic IPs.

### Gateway (Channel Registry)
- Prioritize WhatsApp for critical alerts (Security/Down state).
- Use CLI for high-bandwidth telemetry and debugging tasks.
