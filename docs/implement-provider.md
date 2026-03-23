# Implement a DAP Provider

Make your platform DAP-compatible. Examples use Node.js/Express and curl against the mock server (`localhost:3000`).

---

## 1. Serve the Provider Card (2 min)

`GET /.well-known/dap-provider.json` — no auth. Agents discover your endpoints here.

```js
app.get('/.well-known/dap-provider.json', (_req, res) => {
  res.json({
    schema: 'dap:provider:v1',
    domain: 'yourplatform.com',
    name: 'Your Platform',
    endpoints: {
      identity: 'https://yourplatform.com/dap/v1/identity',
      discovery: 'https://yourplatform.com/dap/v1/discover',
      connections: 'https://yourplatform.com/dap/v1/connections',
    },
    supported_states: ['REQUESTED', 'MATCHED', 'ENGAGED', 'OPEN'],
    policies: {},
  });
});
```

```bash
curl http://localhost:3000/.well-known/dap-provider.json
```

## 2. Implement Identity (3 min)

`GET /dap/v1/identity/verify` — verification status only, no PII.

```js
app.get('/dap/v1/identity/verify', auth, (req, res) => {
  const user = req.principal;
  res.json({
    verified: user.isVerified,
    verification_level: mapLevel(user), // none | basic | standard | strong
    member_since_days: daysSince(user.createdAt),
  });
});
```

```bash
curl -H "Authorization: Bearer test-token" http://localhost:3000/dap/v1/identity/verify
```

## 3. Implement Discovery (3 min)

`POST /dap/v1/discover` — wire into your matching engine, return anonymized candidates.

```js
app.post('/dap/v1/discover', auth, async (req, res) => {
  const { intents, filters, limit } = req.body;
  const matches = await yourEngine.find({
    excludeUser: req.principal.id, intents, filters,
    limit: Math.min(limit || 10, 50),
  });
  res.json({
    candidates: matches.map(u => ({
      principal_token: u.dapToken,
      compatibility_score: u.score,
      verified: u.isVerified,
      shared_topic_count: u.sharedTopics,
    })),
  });
});
```

```bash
curl -X POST http://localhost:3000/dap/v1/discover \
  -H "Authorization: Bearer test-token" -H "Content-Type: application/json" \
  -d '{"intents":["relationship"],"limit":3}'
```

## 4. Implement Connection Lifecycle (10 min)

Six states: `NONE → REQUESTED → MATCHED → ENGAGED → OPEN`, plus `TERMINATED` from any active state.

**Request** (`POST /connections/request`) — NONE → REQUESTED, unilateral:

```bash
curl -X POST http://localhost:3000/dap/v1/connections/request \
  -H "Authorization: Bearer test-token" -H "Content-Type: application/json" \
  -d '{"recipient_token":"dap_p_abc123","request_id":"550e8400-e29b-41d4-a716-446655440000"}'
```

**Get** (`GET /connections/{id}`) — returns full ConnectionRecord:

```bash
curl -H "Authorization: Bearer test-token" http://localhost:3000/dap/v1/connections/conn_001
```

**Respond** (`POST /connections/{id}/respond`) — accept/decline/block:

```bash
curl -X POST http://localhost:3000/dap/v1/connections/conn_001/respond \
  -H "Authorization: Bearer test-token" -H "Content-Type: application/json" \
  -d '{"decision":"accept","request_id":"550e8400-e29b-41d4-a716-446655440001"}'
```

**Upgrade** (`POST /connections/{id}/upgrade`) — bilateral, both must request same target:

```bash
curl -X POST http://localhost:3000/dap/v1/connections/conn_001/upgrade \
  -H "Authorization: Bearer test-token" -H "Content-Type: application/json" \
  -d '{"requested_state":"ENGAGED","request_id":"550e8400-e29b-41d4-a716-446655440002"}'
```

**Withdraw** (`POST /connections/{id}/withdraw`) — unilateral termination:

```bash
curl -X POST http://localhost:3000/dap/v1/connections/conn_001/withdraw \
  -H "Authorization: Bearer test-token" -H "Content-Type: application/json" \
  -d '{"request_id":"550e8400-e29b-41d4-a716-446655440003"}'
```

**Block** (`POST /connections/{id}/block`) — permanent, prevents reconnection:

```bash
curl -X POST http://localhost:3000/dap/v1/connections/conn_001/block \
  -H "Authorization: Bearer test-token" -H "Content-Type: application/json" \
  -d '{"request_id":"550e8400-e29b-41d4-a716-446655440004"}'
```

**Pending** (`GET /connections/pending`) — actionable items for the principal:

```bash
curl -H "Authorization: Bearer test-token" http://localhost:3000/dap/v1/connections/pending
```

## 5. Enforce effective_state = min(A, B)

The core invariant. Each participant has an individual state; the connection's effective state is always the lower.

```js
const ORDER = { NONE: 0, REQUESTED: 1, MATCHED: 2, ENGAGED: 3, OPEN: 4, TERMINATED: -1 };

function effectiveState(participants) {
  const [a, b] = participants.map(p => ORDER[p.state]);
  if (a === -1 || b === -1) return 'TERMINATED';
  return Object.keys(ORDER).find(k => ORDER[k] === Math.min(a, b));
}
```

Enforce this on every state mutation. The lower-trust party always governs.

## 6. Conformance Checklist

**MUST**:
- [ ] `GET /.well-known/dap-provider.json` — no auth
- [ ] `GET /dap/v1/identity/verify` — no PII
- [ ] `POST /dap/v1/discover` — anonymized, respects `limit`
- [ ] `POST /dap/v1/connections/request` — creates REQUESTED
- [ ] `GET /dap/v1/connections/{id}` — returns ConnectionRecord
- [ ] `POST /dap/v1/connections/{id}/respond` — accept/decline/block
- [ ] `POST /dap/v1/connections/{id}/upgrade` — bilateral consent
- [ ] `POST /dap/v1/connections/{id}/withdraw` — unilateral termination
- [ ] `POST /dap/v1/connections/{id}/block` — permanent termination
- [ ] `GET /dap/v1/connections/pending` — lists actionable items
- [ ] `effective_state = min(A, B)` enforced everywhere
- [ ] `request_id` (UUID) on all mutating requests
- [ ] Optimistic locking via `version` on ConnectionRecord
- [ ] Errors follow RFC 7807
- [ ] Bearer auth on all endpoints except provider card
- [ ] Principal tokens are opaque, ephemeral, non-linkable

**SHOULD**: OAuth 2.0 with PKCE | Rate-limit discovery (100/hr) | Declare policies in provider card

**MAY**: Extend with affinity signals, disclosure classes, interaction formats (see DAP Extensions)

---

*Built against [DAP Core v0.1.0](../spec/dap-core.md).*
