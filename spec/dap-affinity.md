# DAP Affinity Extension

*Non-normative. This document describes an OPTIONAL extension for advisory relationship signals.*

| Field | Value |
|-------|-------|
| Status | Draft |
| Type | Non-normative Extension |
| Requires | DAP Core |

---

## 1. Purpose

Affinity signals represent a provider's estimate of relationship strength between two principals. They MAY be used to recommend state transitions but MUST NOT directly modify connection state.

> Affinity signals are advisory. They suggest; they do not decide.

---

## 2. Affinity Object

Providers that implement affinity SHOULD include it in the connection record:

```json
{
  "connection_id": "dap_conn_x1y2z3",
  "effective_state": "MATCHED",
  "affinity": {
    "score": 0.72,
    "confidence": 0.81,
    "trend": "increasing",
    "recommendation": "suggest_upgrade"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `score` | float 0-1 | Provider-computed relationship strength |
| `confidence` | float 0-1 | How reliable the score is (more data = higher) |
| `trend` | enum | `increasing`, `stable`, `decreasing` |
| `recommendation` | string or null | What the provider suggests (e.g., `suggest_upgrade`, `no_action`) |

---

## 3. Computation

DAP does not prescribe how affinity is computed. Providers choose their own algorithms, signals, and weights. This is a competitive differentiator, not a protocol concern.

Common input signals include (but are not limited to):
- Message frequency and reciprocity
- Response patterns
- Session duration and frequency
- Interaction diversity
- Provider-specific quality metrics

---

## 4. Constraints

Even though affinity is non-normative, implementations that include it MUST respect these Core constraints:

1. Affinity MUST NOT directly trigger a state upgrade
2. Affinity MUST NOT override an explicit participant decision
3. Affinity MAY be used as an input to provider policies (e.g., inactivity downgrade)
4. Affinity SHOULD be transparent — providers SHOULD expose the score and recommendation to agents so principals can make informed decisions

---

## 5. Decay

Providers that implement affinity SHOULD decrease the score during periods of inactivity. The decay rate is provider-defined.

Providers MAY use affinity decay as one input for downgrade policies, but affinity decay alone MUST NOT be the sole automated trigger for state downgrade without a declared policy.

---

*This is a non-normative extension. Providers MAY implement affinity, ignore it, or use an alternative approach.*
