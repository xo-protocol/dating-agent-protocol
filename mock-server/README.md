# DAP Mock Server

Minimal mock implementation of the DAP Core specification for testing integrations.

```
npm install && npm start
```

Server runs at http://localhost:3000

## Endpoints (9 Core + Provider Card)

| # | Method | Path | Description |
|---|--------|------|-------------|
| - | GET | `/.well-known/dap-provider.json` | Provider card |
| 1 | GET | `/dap/v1/identity/verify` | Principal identity verification |
| 2 | POST | `/dap/v1/discover` | Search for compatible principals |
| 3 | POST | `/dap/v1/connections/request` | Create connection (NONE -> REQUESTED) |
| 4 | GET | `/dap/v1/connections/:id` | Get connection record |
| 5 | POST | `/dap/v1/connections/:id/respond` | Accept, decline, or block a request |
| 6 | POST | `/dap/v1/connections/:id/upgrade` | Bilateral state upgrade |
| 7 | POST | `/dap/v1/connections/:id/withdraw` | Withdraw -> TERMINATED |
| 8 | POST | `/dap/v1/connections/:id/block` | Block -> TERMINATED (permanent) |
| 9 | GET | `/dap/v1/connections/pending` | List pending requests and upgrades |

## Connection States

`NONE` < `REQUESTED` < `MATCHED` < `ENGAGED` < `OPEN` | `TERMINATED`

- **effective_state** = min(participant A state, participant B state)
- Upgrades beyond REQUESTED require bilateral consent (both call `/upgrade`)
- Version increments on every state change

## Auth

Pass any `Authorization: Bearer <token>` header. If the token matches a mock user's `principal_token`, you act as that user. Otherwise defaults to user 0 (Alex Chen).

## Mock Data

- 5 users with `dap_p_` prefixed tokens
- 2 pre-existing connections: one MATCHED, one ENGAGED

## Errors

RFC 7807 format with `urn:dap:error:` prefix.
