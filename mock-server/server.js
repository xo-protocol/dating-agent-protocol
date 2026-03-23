const express = require('express');
const { users, connections, upgradeRequests, connId, STATE_ORDER, stateRank, effectiveState } = require('./mock-data');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// --- Auth: accept any Bearer token; resolve principal or default to user[0] ---
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return dapError(res, 401, 'unauthorized', 'Unauthorized', 'Missing or invalid Bearer token');
  req.principal = users.find((u) => u.principal_token === auth.slice(7)) || users[0];
  next();
}

// --- RFC 7807 error helper ---
function dapError(res, status, code, title, detail) {
  return res.status(status).json({ type: `urn:dap:error:${code}`, status, title, detail });
}

function findParticipant(conn, token) {
  return conn.participants.find((p) => p.principal_token === token);
}
function touchConnection(conn) {
  conn.version += 1;
  conn.updated_at = new Date().toISOString();
  conn.effective_state = effectiveState(conn.participants[0].state, conn.participants[1].state);
}
function requireConn(req, res) {
  const conn = connections[req.params.id];
  if (!conn) { dapError(res, 404, 'not_found', 'Not Found', 'Connection not found'); return null; }
  if (conn.effective_state === 'TERMINATED') { dapError(res, 403, 'terminated', 'Terminated', 'Connection is terminated'); return null; }
  const me = findParticipant(conn, req.principal.principal_token);
  if (!me) { dapError(res, 403, 'forbidden', 'Forbidden', 'You are not a participant'); return null; }
  return { conn, me };
}

// --- Provider Card ---
app.get('/.well-known/dap-provider.json', (_req, res) => {
  res.json({
    schema: 'dap:provider:v1', domain: 'localhost', name: 'DAP Mock Provider',
    endpoints: {
      identity: `http://localhost:${PORT}/dap/v1/identity`,
      discovery: `http://localhost:${PORT}/dap/v1/discover`,
      connections: `http://localhost:${PORT}/dap/v1/connections`,
    },
    supported_states: ['REQUESTED', 'MATCHED', 'ENGAGED', 'OPEN'],
    policies: {},
  });
});

// --- 1. Identity Verify ---
app.get('/dap/v1/identity/verify', authMiddleware, (req, res) => {
  const p = req.principal;
  res.json({ principal_token: p.principal_token, display_name: p.display_name, verification_level: p.verification_level, authenticated: true });
});

// --- 2. Discover ---
app.post('/dap/v1/discover', authMiddleware, (req, res) => {
  const { intent, location_metro, limit } = req.body || {};
  let c = users.filter((u) => u.principal_token !== req.principal.principal_token);
  if (intent) c = c.filter((u) => u.profile.intent === intent);
  if (location_metro) c = c.filter((u) => u.profile.location_metro === location_metro);
  c = c.slice(0, Math.min(limit || 5, 10));
  res.json({
    candidates: c.map((u) => ({ principal_token: u.principal_token, display_name: u.display_name, verification_level: u.verification_level, profile_summary: u.profile })),
    total: c.length,
  });
});

// --- 3. Connection Request (NONE -> REQUESTED) ---
app.post('/dap/v1/connections/request', authMiddleware, (req, res) => {
  const { recipient_token } = req.body || {};
  if (!recipient_token) return dapError(res, 400, 'bad_request', 'Bad Request', 'recipient_token is required');
  if (!users.find((u) => u.principal_token === recipient_token))
    return dapError(res, 404, 'not_found', 'Not Found', 'Recipient not found');

  const id = connId();
  const now = new Date().toISOString();
  const conn = {
    connection_id: id,
    participants: [
      { principal_token: req.principal.principal_token, state: 'REQUESTED' },
      { principal_token: recipient_token, state: 'NONE' },
    ],
    effective_state: 'NONE', version: 1, created_at: now, updated_at: now,
  };
  connections[id] = conn;
  res.status(201).json(conn);
});

// --- 9. Pending (before :id to avoid route conflict) ---
app.get('/dap/v1/connections/pending', authMiddleware, (req, res) => {
  const token = req.principal.principal_token;
  const pending = [];
  for (const conn of Object.values(connections)) {
    const me = findParticipant(conn, token);
    if (!me) continue;
    if (me.state === 'NONE') {
      const other = conn.participants.find((p) => p.principal_token !== token);
      if (other && other.state === 'REQUESTED') pending.push({ type: 'incoming_request', connection: conn });
    }
    const upgrade = upgradeRequests[conn.connection_id];
    if (upgrade && !upgrade.requested_by.has(token))
      pending.push({ type: 'upgrade_request', target_state: upgrade.target_state, connection: conn });
  }
  res.json({ pending, total: pending.length });
});

// --- 4. Get Connection ---
app.get('/dap/v1/connections/:id', authMiddleware, (req, res) => {
  const conn = connections[req.params.id];
  if (!conn) return dapError(res, 404, 'not_found', 'Not Found', 'Connection not found');
  res.json(conn);
});

// --- 5. Respond (accept/decline/block) ---
app.post('/dap/v1/connections/:id/respond', authMiddleware, (req, res) => {
  const ctx = requireConn(req, res); if (!ctx) return;
  const { conn, me } = ctx;
  if (me.state !== 'NONE')
    return dapError(res, 409, 'invalid_transition', 'Invalid Transition', 'Can only respond when your state is NONE');

  const { action } = req.body || {};
  if (action === 'accept') {
    conn.participants.forEach((p) => { p.state = 'MATCHED'; });
    touchConnection(conn); return res.json(conn);
  }
  if (action === 'decline') {
    conn.participants.forEach((p) => { p.state = 'NONE'; });
    touchConnection(conn); return res.json(conn);
  }
  if (action === 'block') {
    conn.participants.forEach((p) => { p.state = 'TERMINATED'; });
    touchConnection(conn); return res.json(conn);
  }
  return dapError(res, 400, 'bad_request', 'Bad Request', 'action must be accept, decline, or block');
});

// --- 6. Upgrade (bilateral) ---
app.post('/dap/v1/connections/:id/upgrade', authMiddleware, (req, res) => {
  const ctx = requireConn(req, res); if (!ctx) return;
  const { conn, me } = ctx;
  const { target_state } = req.body || {};

  if (!['ENGAGED', 'OPEN'].includes(target_state))
    return dapError(res, 400, 'bad_request', 'Bad Request', 'target_state must be ENGAGED or OPEN');
  if (stateRank(target_state) <= stateRank(conn.effective_state))
    return dapError(res, 409, 'invalid_transition', 'Invalid Transition', `Already at ${conn.effective_state}`);
  const curIdx = STATE_ORDER.indexOf(conn.effective_state);
  if (STATE_ORDER.indexOf(target_state) !== curIdx + 1)
    return dapError(res, 409, 'invalid_transition', 'Invalid Transition', 'Must upgrade one step at a time');

  const key = conn.connection_id;
  if (!upgradeRequests[key] || upgradeRequests[key].target_state !== target_state)
    upgradeRequests[key] = { target_state, requested_by: new Set() };
  upgradeRequests[key].requested_by.add(req.principal.principal_token);

  const allTokens = conn.participants.map((p) => p.principal_token);
  if (allTokens.every((t) => upgradeRequests[key].requested_by.has(t))) {
    conn.participants.forEach((p) => { p.state = target_state; });
    delete upgradeRequests[key];
    touchConnection(conn);
    return res.json(conn);
  }
  me.state = target_state;
  touchConnection(conn);
  res.json({ ...conn, _upgrade_pending: true, _waiting_for: allTokens.filter((t) => !upgradeRequests[key].requested_by.has(t)) });
});

// --- 7. Withdraw -> TERMINATED ---
app.post('/dap/v1/connections/:id/withdraw', authMiddleware, (req, res) => {
  const ctx = requireConn(req, res); if (!ctx) return;
  ctx.conn.participants.forEach((p) => { p.state = 'TERMINATED'; });
  touchConnection(ctx.conn);
  res.json(ctx.conn);
});

// --- 8. Block -> TERMINATED (permanent) ---
app.post('/dap/v1/connections/:id/block', authMiddleware, (req, res) => {
  const ctx = requireConn(req, res); if (!ctx) return;
  ctx.conn.participants.forEach((p) => { p.state = 'TERMINATED'; });
  ctx.conn.blocked = true;
  touchConnection(ctx.conn);
  res.json(ctx.conn);
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`DAP Mock Server running at http://localhost:${PORT}`);
  console.log(`Provider card: http://localhost:${PORT}/.well-known/dap-provider.json`);
  console.log('9 Core endpoints + provider card ready');
});
