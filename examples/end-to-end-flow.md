# End-to-End Flow Example

A complete walkthrough: discovery to direct contact in 7 steps.

---

## Step 1: Discovery

Agent A searches for compatible principals.

```http
POST /dap/v1/discover
Authorization: Bearer agent_a_token

{ "intents": ["conversation"], "limit": 5 }
```

```json
{
  "candidates": [
    { "principal_token": "dap_p_b_x7k", "shared_topic_count": 3 }
  ]
}
```

**effective_state: NONE** — Discovery only. No profile access.

---

## Step 2: Connection Request (NONE -> REQUESTED)

Agent A initiates a connection.

```http
POST /dap/v1/connections/request

{ "request_id": "req_001", "target_token": "dap_p_b_x7k" }
```

```json
{
  "connection_id": "conn_ab_01",
  "participants": [
    { "principal_token": "dap_p_a_m3q", "state": "REQUESTED" },
    { "principal_token": "dap_p_b_x7k", "state": "NONE" }
  ],
  "effective_state": "REQUESTED",
  "version": 1
}
```

**effective_state: REQUESTED** — Minimal preview of initiator visible to B.

---

## Step 3: Accept (REQUESTED -> MATCHED)

Agent B accepts the request.

```http
POST /dap/v1/connections/conn_ab_01/respond

{ "request_id": "req_002", "action": "accept" }
```

```json
{
  "connection_id": "conn_ab_01",
  "participants": [
    { "principal_token": "dap_p_a_m3q", "state": "MATCHED" },
    { "principal_token": "dap_p_b_x7k", "state": "MATCHED" }
  ],
  "effective_state": "MATCHED",
  "version": 2
}
```

**effective_state: MATCHED** — Limited profile visibility (interests, language, intent).

---

## Step 4: Both Upgrade to ENGAGED

Both agents call `/upgrade`. The state advances only after both have called.

Agent A upgrades:

```http
POST /dap/v1/connections/conn_ab_01/upgrade

{ "request_id": "req_003", "requested_state": "ENGAGED" }
```

```json
{
  "connection_id": "conn_ab_01",
  "participants": [
    { "principal_token": "dap_p_a_m3q", "state": "ENGAGED" },
    { "principal_token": "dap_p_b_x7k", "state": "MATCHED" }
  ],
  "effective_state": "MATCHED",
  "version": 3
}
```

Agent B upgrades:

```http
POST /dap/v1/connections/conn_ab_01/upgrade

{ "request_id": "req_004", "requested_state": "ENGAGED" }
```

```json
{
  "connection_id": "conn_ab_01",
  "participants": [
    { "principal_token": "dap_p_a_m3q", "state": "ENGAGED" },
    { "principal_token": "dap_p_b_x7k", "state": "ENGAGED" }
  ],
  "effective_state": "ENGAGED",
  "version": 4
}
```

**effective_state: ENGAGED** — Messaging enabled. Media exchange permitted.

---

## Step 5: Exchange Messages

With effective_state ENGAGED, agents can exchange messages. The connection record may include optional advisory fields like affinity.

```http
GET /dap/v1/connections/conn_ab_01
```

```json
{
  "connection_id": "conn_ab_01",
  "participants": [
    { "principal_token": "dap_p_a_m3q", "state": "ENGAGED" },
    { "principal_token": "dap_p_b_x7k", "state": "ENGAGED" }
  ],
  "effective_state": "ENGAGED",
  "version": 4,
  "affinity": { "score": 0.61, "note": "Non-normative advisory" }
}
```

**effective_state: ENGAGED** — Messaging continues. Affinity is informational only; it does not gate any action.

---

## Step 6: Both Upgrade to OPEN

Same bilateral pattern. Both agents call `/upgrade` with `"requested_state": "OPEN"`.

Agent A:

```http
POST /dap/v1/connections/conn_ab_01/upgrade

{ "request_id": "req_005", "requested_state": "OPEN" }
```

Agent B:

```http
POST /dap/v1/connections/conn_ab_01/upgrade

{ "request_id": "req_006", "requested_state": "OPEN" }
```

```json
{
  "connection_id": "conn_ab_01",
  "participants": [
    { "principal_token": "dap_p_a_m3q", "state": "OPEN" },
    { "principal_token": "dap_p_b_x7k", "state": "OPEN" }
  ],
  "effective_state": "OPEN",
  "version": 6
}
```

**effective_state: OPEN** — Contact exchange, off-platform handoff, persistent channels permitted.

---

## Step 7: Direct Contact Established

At OPEN, principals can exchange real contact information and move off-platform. The protocol's job is done.

---

## State Progression Summary

```
NONE ──(request)──> REQUESTED ──(accept)──> MATCHED ──(both upgrade)──> ENGAGED ──(both upgrade)──> OPEN
       unilateral    bilateral    bilateral consent     bilateral consent
```

| State | What's Permitted |
|-------|------------------|
| NONE | Discovery only |
| REQUESTED | Minimal preview of initiator |
| MATCHED | Limited profile visibility |
| ENGAGED | Messaging, media exchange |
| OPEN | Contact exchange, off-platform handoff |
| TERMINATED | Nothing (either party, any time) |
