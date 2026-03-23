# DAP Extensions

*Non-normative. This document describes OPTIONAL extensions that providers MAY implement to enrich the connection experience.*

| Field | Value |
|-------|-------|
| Status | Draft |
| Type | Non-normative Extension |
| Requires | DAP Core |

> The extensions below are reference patterns, not requirements. Implementations are free to define their own affinity models, disclosure systems, and interaction primitives. DAP Core is the only normative specification.

---

## 1. Disclosure Classes

Providers MAY define disclosure classes to create finer-grained permission levels within a connection state.

### Concept

A disclosure class represents a category of information with a sensitivity level. Each class has:
- A **state floor** — the minimum effective state required
- A **disclosure policy** — how consent is managed (provider-defined)

### Example Classes

| Class | Sensitivity | State Floor | Example Policy |
|-------|------------|-------------|----------------|
| 1 | Minimal | MATCHED | Auto-share |
| 2 | Low | MATCHED | Voluntary |
| 3 | Medium | ENGAGED | Provider-defined |
| 4 | High | ENGAGED | Provider-defined |
| 5 | Critical | OPEN | Provider-defined |

**Important:** The specific disclosure policies (auto, confirm-once, confirm-each-time) are NOT standardized by DAP. Providers define their own policies for each class. The only normative requirement is that **no disclosure MAY exceed the effective state boundary** (from DAP Core Section 6).

### Example Disclosure Types

Providers MAY define disclosure types within each class. Common types include:

- **Class 1-2**: Interest categories, language, region, age range
- **Class 3**: Display name, profile summary, blurred photo
- **Class 4**: Clear photo, real name, social media links
- **Class 5**: Contact information, off-platform identifiers

---

## 2. Asymmetric Disclosure

Providers MAY allow asymmetric disclosure: one participant reveals more than the other.

When implementing asymmetric disclosure:
- Each participant's disclosures are tracked independently
- No participant is obligated to reciprocate
- Providers MAY nudge the less-disclosed party but MUST NOT require reciprocation

---

## 3. Vibe Signals

Providers MAY support rich interaction formats beyond text messaging. These are collectively called "vibe signals."

### Example Signal Types

| Type | Description |
|------|-------------|
| `voice_intro` | Short audio clip (provider-hosted) |
| `mood` | Current emotional state (structured enum) |
| `prompt_response` | Response to a provider-defined conversation prompt |
| `confession` | Low-stakes personal sharing (short text) |
| `song_share` | A song representing current mood (title + artist) |
| `photo_moment` | Ephemeral current-moment photo (provider-hosted, auto-expiring) |

Vibe signals SHOULD:
- Be provider-hosted (not direct file URLs)
- Be subject to content moderation
- Auto-expire where appropriate (especially photos)

### Conversation Prompts

Providers MAY serve structured prompts to encourage interaction:

```json
{
  "prompt_id": "...",
  "category": "icebreaker",
  "text": "Describe your ideal lazy Sunday in 3 words"
}
```

---

## 4. Identity Verification

Providers MAY implement identity verification to establish that a principal is a real, unique human. DAP Core requires only that providers expose a verification status (via `/dap/v1/identity/verify`).

Extensions beyond the minimum include:
- **Verification levels**: none, basic, standard, strong, sovereign
- **Verification methods**: email, phone, social accounts, biometric liveness, government ID, SBT, World ID
- **Attestations**: Structured proof of completed verifications
- **Sybil resistance**: Assessment of how resistant the verification is to fake accounts

Providers define their own verification methods and levels. DAP does not prescribe which methods are required.

---

## 5. Reputation

Providers MAY implement behavioral reputation systems. Common patterns include:
- Tiered reputation (e.g., newcomer, established, trusted, exemplary)
- Normalized scores (0-1)
- Behavioral tracking categories (engagement, reliability, safety, community)

Reputation MAY be used as:
- An input to affinity scoring
- A precondition for state transitions (via provider policy)
- A filter in discovery results

Reputation MUST NOT be used to directly modify connection state without participant awareness.

---

## 6. Trust & Safety

Providers SHOULD implement trust and safety mechanisms including:
- Incident reporting (harassment, fraud, impersonation)
- Safety signals (fraud risk assessment, block rate)
- Agent verification (proving an agent has principal authorization)

Safety events MAY trigger state transitions via provider policy (e.g., report → TERMINATED). Such policies are declared in the Provider Card.

---

## 7. Conversation Aid

Providers MAY implement tools that help principals start and sustain conversations:
- **Break ice**: Contextual conversation starters based on shared interests
- **Conversation health**: Metrics on conversation quality (without exposing content)
- **Wingman**: Topic suggestions when conversation stalls

These tools MUST operate within the provider boundary. Conversation content MUST NOT be exposed through the protocol.

---

## 8. Provider Policy Engine

Providers MAY implement a policy engine that governs automatic transitions and preconditions.

### Policy Types

| Type | Description |
|------|-------------|
| Timeout | Auto-transition on expiry (e.g., unanswered request → NONE) |
| Inactivity | Downgrade after idle period |
| Safety | Enforcement on report/block events |
| Precondition | Requirements before a transition is allowed |

### Policy Declaration

Providers SHOULD declare active policies in the Provider Card and in connection state responses, so agents can check preconditions before requesting transitions.

```json
{
  "policies": {
    "request_timeout": "48h",
    "inactivity_downgrade": "provider-defined",
    "upgrade_preconditions": {
      "OPEN": { "min_verification_level": "standard" }
    }
  }
}
```

---

*All extensions in this document are non-normative. Providers MAY implement any, all, or none of them. The only normative specification is [DAP Core](./dap-core.md).*
