# Dating Agent Protocol (DAP)

A minimal protocol for AI agents to help humans form trusted connections — safely, privately, and across platforms.

> **Status:** Draft v0.1.0 | **License:** Apache 2.0

---

## What DAP Is

DAP defines the minimum rules for AI agents on different platforms to negotiate human connections on behalf of their principals. It solves a specific problem that no existing protocol addresses:

> **How does an AI agent introduce the human behind it to another human — without exposing either person's identity until both are ready?**

This requires four things that generic protocols (A2A, OAuth, HTTP) don't provide:
1. **Progressive disclosure** — information revealed in stages, not all at once
2. **Bilateral consent** — both parties agree at each escalation step
3. **Privacy by default** — real identities hidden behind ephemeral tokens
4. **Safety termination** — either party can exit at any time, immediately

DAP is an application-layer protocol on top of [A2A](https://github.com/google/A2A) and [MCP](https://modelcontextprotocol.io/).

**DAP defines what is allowed, not what is recommended.**

While designed for dating and social connection, the core protocol is domain-agnostic — the state machine and consent model apply to any system requiring trust-based relationship escalation.

## What DAP Standardizes

- **Connection states**: `NONE → REQUESTED → MATCHED → ENGAGED → OPEN → TERMINATED`
- **Transition rules**: bilateral consent for upgrades, unilateral termination
- **Permission boundaries**: what actions are allowed at each state
- **Conflict resolution**: `effective_state = min(A, B)` — the lower-trust party governs
- **Principal tokens**: ephemeral, opaque, non-linkable identifiers
- **State authority**: only participant actions or declared policies can change state

## What DAP Does NOT Standardize

- Matching, recommendation, or discovery algorithms
- Affinity, compatibility, or trust scoring
- Disclosure policies or UX patterns
- Interaction formats (voice, video, prompts)
- Identity verification methods
- Domain-specific logic

These are competitive differentiators for providers, not protocol concerns.

## Connection States

| State | What's Permitted |
|-------|-----------------|
| `REQUESTED` | Minimal preview |
| `MATCHED` | Limited profile visibility |
| `ENGAGED` | Active communication |
| `OPEN` | Contact exchange, off-platform |
| `TERMINATED` | Nothing |

## Specifications

| Document | Type | Description |
|----------|------|-------------|
| [DAP Core](spec/dap-core.md) | **Normative** | The protocol. States, transitions, permissions, schema, endpoints. |
| [DAP Affinity](spec/dap-affinity.md) | Non-normative | Optional advisory signals (warmth, recommendations) |
| [DAP Extensions](spec/dap-extensions.md) | Non-normative | Disclosure classes, vibe signals, identity, reputation, safety, conversation aid |

**DAP Core is the only normative specification.** Everything else is optional.

## Quick Start

### Try the Mock Server

```bash
cd mock-server && npm install && npm start
# http://localhost:3000/dap/v1/discover
```

### Implement a Provider

1. Serve `/.well-known/dap-provider.json` ([example](examples/dap-provider-card.json))
2. Implement [9 core endpoints](spec/dap-core.md#92-core-endpoints)
3. Follow the [provider guide](docs/implement-provider.md)

### Integrate as an Agent

Use the REST API directly or wrap it as an [MCP server](examples/mcp-server.js) for Claude/GPT.

## Project Structure

```
dating-agent-protocol/
├── spec/
│   ├── dap-core.md          # The protocol (normative)
│   ├── dap-affinity.md      # Advisory signals (non-normative)
│   └── dap-extensions.md    # Optional features (non-normative)
├── schemas/                  # JSON Schemas
├── mock-server/              # Runnable demo server
├── examples/                 # Integration examples
├── docs/                     # Guides and launch materials
├── reference/xo-provider/    # XO's provider mapping
├── openapi.yaml              # OpenAPI 3.0.3
├── CONTRIBUTING.md           # How to participate
└── LICENSE                   # Apache 2.0
```

## Relationship to Existing Standards

| Standard | Relationship |
|----------|-------------|
| [A2A](https://github.com/google/A2A) | DAP tasks are A2A tasks. DAP extends Agent Cards with social fields. |
| [MCP](https://modelcontextprotocol.io/) | Providers can expose DAP as MCP tools. |
| [W3C DID](https://www.w3.org/TR/did-core/) | Supported as an optional identity method (extension). |
| OAuth 2.0 | Used for principal authorization with providers. |

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| v0.1 — Core Draft | **Current** | Core spec, schemas, mock server, examples |
| v0.2 — Hardening | Planned | Conformance tests, error catalog, second provider |
| v1.0 — Stable | Planned | Backward compatibility guarantees |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache 2.0

---

*DAP is created by [XO](https://xoxo.space) and open to all contributors.*
