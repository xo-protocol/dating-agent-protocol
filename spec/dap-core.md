# DAP Core Specification

The minimum interoperable rules for AI agents to help humans form trusted connections — with progressive disclosure, bilateral consent, and privacy by default.

| Field | Value |
|-------|-------|
| Status | Draft |
| Version | 0.1.0 |
| License | Apache 2.0 |

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

---

## 1. Overview

DAP defines the minimum rules for AI agents to negotiate trusted human connections across platforms. It solves a specific problem: **how to progressively build trust between two strangers through their agents, without exposing either person's identity until both are ready.**

This requires protocol-level guarantees that generic agent protocols (A2A, MCP, OAuth) do not provide:

1. **Progressive disclosure** — permission boundaries expand as trust builds
2. **Bilateral consent** — both parties must agree before each escalation
3. **Privacy by default** — principals are identified by ephemeral tokens, never real identities
4. **Asymmetric state** — each party may be at a different trust level; the lower level governs
5. **Safety termination** — either party can exit immediately at any time

DAP is an application-layer protocol on top of [A2A](https://github.com/google/A2A) and [MCP](https://modelcontextprotocol.io/).

DAP defines **what is allowed**, not **what is recommended**.

DAP intentionally does NOT standardize:
- Matching, recommendation, or discovery algorithms
- Affinity, compatibility, or trust scoring
- User experience, interaction formats, or content types

---

## 2. Terminology

| Term | Definition |
|------|-----------|
| **Principal** | A human who authorizes an agent to act on their behalf |
| **Agent** | An AI agent acting for a principal in the DAP protocol |
| **Provider** | A platform that implements DAP and holds user data |
| **Connection** | A bilateral relationship between two principals |
| **Effective State** | The operative permission level of a connection, derived from both participants |

---

## 3. Connection Model

A connection represents a bilateral relationship between two principals. Each principal maintains an **individual state**. The connection's **effective state** determines what actions are permitted.

```
effective_state = min(A.state, B.state)
```

The system MUST enforce the effective state for all permission checks. This ensures the lower-trust party always governs access.

---

## 4. Connection States

| State | Definition |
|-------|-----------|
| `NONE` | No relationship exists |
| `REQUESTED` | One principal has expressed intent to connect; awaiting response |
| `MATCHED` | Both principals have confirmed mutual interest |
| `ENGAGED` | Both principals have permitted active communication |
| `OPEN` | Both principals have permitted high-trust exchange |
| `TERMINATED` | Connection is closed; no further interaction permitted |

State ordering: `NONE < REQUESTED < MATCHED < ENGAGED < OPEN`

---

## 5. State Transitions

### 5.1 Upgrades

| From | To | Requirement |
|------|----|-------------|
| `NONE` | `REQUESTED` | Unilateral — one principal initiates |
| `REQUESTED` | `MATCHED` | Bilateral — target principal accepts |
| `MATCHED` | `ENGAGED` | Bilateral — both principals explicitly consent |
| `ENGAGED` | `OPEN` | Bilateral — both principals explicitly consent |

All upgrades beyond `REQUESTED` MUST require explicit consent from both principals. Automated systems MUST NOT upgrade state without participant action.

### 5.2 Downgrades

| From | To | Requirement |
|------|----|-------------|
| `OPEN` | `ENGAGED` | Unilateral participant action OR provider policy |
| `ENGAGED` | `MATCHED` | Unilateral participant action OR provider policy |
| `REQUESTED` | `NONE` | Target declines OR request expires |

Providers MAY implement policies that trigger automatic downgrades (e.g., inactivity). Such policies MUST be declared and inspectable.

### 5.3 Termination

| From | To | Requirement |
|------|----|-------------|
| Any active state | `TERMINATED` | Unilateral — either principal at any time |

Termination MUST be available from any active state. A terminated connection MUST NOT be reactivated. Providers MAY allow the same principals to create a new connection after a cooldown period.

### 5.4 State Authority

State transitions MUST be derived from exactly two sources:

1. **Explicit participant action** — a principal approves, declines, withdraws, or blocks
2. **Predefined provider policy** — a declared rule triggers a transition (e.g., timeout)

No other source is authoritative. Recommendation signals, affinity scores, agents, and external systems MUST NOT directly mutate connection state.

---

## 6. Permission Boundaries

Each effective state defines the maximum actions permitted on the connection:

| Effective State | Permitted Actions |
|-----------------|-------------------|
| `NONE` | Discovery only |
| `REQUESTED` | Minimal preview of initiator |
| `MATCHED` | Limited profile visibility |
| `ENGAGED` | Active communication (messaging, media exchange) |
| `OPEN` | Contact exchange, off-platform handoff, persistent channels |
| `TERMINATED` | None |

Providers MUST enforce these boundaries. Actions attempted at insufficient state MUST return an error.

Providers MAY define finer-grained permissions within a state (see [DAP Extensions](./dap-extensions.md)), but MUST NOT permit actions that exceed the state boundary.

---

## 7. Connection Record

The minimum connection record that providers MUST support:

```json
{
  "connection_id": "string",
  "participants": [
    { "principal_token": "string", "state": "ENGAGED" },
    { "principal_token": "string", "state": "MATCHED" }
  ],
  "effective_state": "MATCHED",
  "version": 14,
  "created_at": "2026-03-23T10:00:00Z",
  "updated_at": "2026-03-25T18:30:00Z"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `connection_id` | REQUIRED | Unique identifier for this connection |
| `participants` | REQUIRED | Array of exactly 2 participants with individual states |
| `effective_state` | REQUIRED | min(participant states) |
| `version` | REQUIRED | Monotonically increasing integer; incremented on every state change |
| `created_at` | REQUIRED | ISO 8601 timestamp |
| `updated_at` | REQUIRED | ISO 8601 timestamp of last state change |

Providers MAY include additional fields (affinity signals, policy declarations, disclosure records) but MUST include these minimum fields.

---

## 8. Principal Tokens

Principals are identified by **ephemeral, opaque tokens** within the protocol. Real identities MUST NOT be exposed across the protocol boundary.

| Property | Requirement |
|----------|-------------|
| Opaque | No information about the principal SHALL be derivable from the token |
| Ephemeral | Tokens MUST expire (provider-defined TTL, minimum 1 hour) |
| Scoped | Different requesting agents MUST receive different tokens for the same principal |
| Non-linkable | It MUST NOT be possible to correlate tokens across agents or sessions |

---

## 9. Provider Requirements

### 9.1 Provider Card

Providers MUST serve a machine-readable provider card at:

```
GET /.well-known/dap-provider.json
```

Minimum fields:

```json
{
  "schema": "dap:provider:v1",
  "domain": "example.social",
  "name": "Example Provider",
  "endpoints": {
    "identity": "https://example.social/dap/v1/identity",
    "discovery": "https://example.social/dap/v1/discover",
    "connections": "https://example.social/dap/v1/connections"
  },
  "supported_states": ["REQUESTED", "MATCHED", "ENGAGED", "OPEN"],
  "policies": {}
}
```

### 9.2 Core Endpoints

Providers MUST implement:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dap/v1/identity/verify` | GET | Return principal's identity verification status |
| `/dap/v1/discover` | POST | Search for compatible principals |
| `/dap/v1/connections/request` | POST | Create a connection (NONE → REQUESTED) |
| `/dap/v1/connections/{id}` | GET | Return connection record |
| `/dap/v1/connections/{id}/respond` | POST | Accept, decline, or block (REQUESTED → MATCHED/NONE/TERMINATED) |
| `/dap/v1/connections/{id}/upgrade` | POST | Request state upgrade (bilateral) |
| `/dap/v1/connections/{id}/withdraw` | POST | Withdraw from connection → TERMINATED |
| `/dap/v1/connections/{id}/block` | POST | Block → TERMINATED (permanent) |
| `/dap/v1/connections/pending` | GET | List pending requests and upgrade approvals |

### 9.3 Error Responses

Errors MUST follow [RFC 7807 Problem Details](https://tools.ietf.org/html/rfc7807):

```json
{
  "type": "urn:dap:error:insufficient_state",
  "status": 428,
  "title": "Insufficient State",
  "detail": "Effective state is MATCHED; messaging requires ENGAGED"
}
```

Standard error codes:

| HTTP Status | When |
|-------------|------|
| `404` | Connection not found |
| `403` | Connection is blocked or terminated |
| `409` | Invalid state transition |
| `410` | Connection expired or archived |
| `428` | Insufficient effective state for requested action |
| `429` | Rate limit exceeded |

---

## 10. Idempotency

All mutating requests MUST include a `request_id` (client-generated UUID). If a provider receives a previously processed `request_id`, it MUST return the original response without re-applying the transition. Providers MUST store request-response mappings for at least 24 hours.

---

## 11. Event Ordering

State-mutating events for a given connection MUST be serialized. Providers MUST use optimistic locking (via the `version` field) or equivalent concurrency control. No two transitions MAY execute concurrently on the same connection.

---

## 12. Extensions

DAP Core is intentionally minimal. Providers and the DAP community MAY define extensions for:

- **Affinity signals** — recommendation scores, warmth metrics (see [DAP Affinity](./dap-affinity.md))
- **Disclosure classes** — fine-grained permission levels within states (see [DAP Extensions](./dap-extensions.md))
- **Interaction formats** — vibe signals, voice notes, prompts (see [DAP Extensions](./dap-extensions.md))
- **Identity verification** — SBT, DID, biometric liveness (see [DAP Extensions](./dap-extensions.md))
- **Reputation systems** — behavioral scoring, portable reputation (see [DAP Extensions](./dap-extensions.md))
- **Trust & safety** — fraud detection, abuse reporting (see [DAP Extensions](./dap-extensions.md))

Extensions MUST NOT violate Core rules. In particular, extensions MUST NOT:
- Upgrade state without participant consent
- Permit actions beyond the effective state boundary
- Expose principal identity across the protocol boundary

---

*DAP Core is the only normative specification. All other DAP documents are non-normative extensions.*
