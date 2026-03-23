const crypto = require('crypto');

// --- State ordering (lower index = lower trust) ---
const STATE_ORDER = ['NONE', 'REQUESTED', 'MATCHED', 'ENGAGED', 'OPEN', 'TERMINATED'];

function stateRank(s) {
  if (s === 'TERMINATED') return -1;
  return STATE_ORDER.indexOf(s);
}

function effectiveState(a, b) {
  if (a === 'TERMINATED' || b === 'TERMINATED') return 'TERMINATED';
  return stateRank(a) <= stateRank(b) ? a : b;
}

function connId() {
  return 'dap_conn_' + crypto.randomBytes(8).toString('hex');
}

// --- Mock Users (5 users with dap_p_ tokens) ---

const users = [
  {
    principal_token: 'dap_p_a1b2c3d4e5f60001',
    display_name: 'Alex Chen',
    verification_level: 'strong',
    profile: {
      age_range: '25-30',
      location_metro: 'Taipei',
      interests: ['hiking', 'coffee', 'photography'],
      intent: 'relationship',
    },
  },
  {
    principal_token: 'dap_p_a1b2c3d4e5f60002',
    display_name: 'Jordan Lee',
    verification_level: 'strong',
    profile: {
      age_range: '28-33',
      location_metro: 'Taipei',
      interests: ['music', 'cooking', 'travel'],
      intent: 'relationship',
    },
  },
  {
    principal_token: 'dap_p_a1b2c3d4e5f60003',
    display_name: 'Sam Rivera',
    verification_level: 'basic',
    profile: {
      age_range: '22-27',
      location_metro: 'Kaohsiung',
      interests: ['gaming', 'anime', 'streetfood'],
      intent: 'casual',
    },
  },
  {
    principal_token: 'dap_p_a1b2c3d4e5f60004',
    display_name: 'Morgan Wu',
    verification_level: 'strong',
    profile: {
      age_range: '30-35',
      location_metro: 'Taichung',
      interests: ['yoga', 'reading', 'wine'],
      intent: 'relationship',
    },
  },
  {
    principal_token: 'dap_p_a1b2c3d4e5f60005',
    display_name: 'Casey Park',
    verification_level: 'sovereign',
    profile: {
      age_range: '26-31',
      location_metro: 'Taipei',
      interests: ['art', 'running', 'dogs'],
      intent: 'relationship',
    },
  },
];

// --- Mock Connections ---
// Connection 1: Alex & Jordan — MATCHED (both accepted)
// Connection 2: Alex & Casey — ENGAGED (both upgraded)

const connections = {
  dap_conn_matched_0001: {
    connection_id: 'dap_conn_matched_0001',
    participants: [
      { principal_token: users[0].principal_token, state: 'MATCHED' },
      { principal_token: users[1].principal_token, state: 'MATCHED' },
    ],
    effective_state: 'MATCHED',
    version: 3,
    created_at: '2026-03-20T10:00:00Z',
    updated_at: '2026-03-20T12:00:00Z',
    // Optional non-normative advisory
    affinity: { score: 0.72, signal: 'shared interests' },
  },
  dap_conn_engaged_0002: {
    connection_id: 'dap_conn_engaged_0002',
    participants: [
      { principal_token: users[0].principal_token, state: 'ENGAGED' },
      { principal_token: users[4].principal_token, state: 'ENGAGED' },
    ],
    effective_state: 'ENGAGED',
    version: 8,
    created_at: '2026-02-14T18:00:00Z',
    updated_at: '2026-03-18T09:00:00Z',
    affinity: { score: 0.89, signal: 'strong conversation momentum' },
  },
};

// --- Pending upgrade requests (tracked per-connection) ---
// Maps: connection_id -> { target_state, requested_by: Set<principal_token> }
const upgradeRequests = {};

module.exports = { users, connections, upgradeRequests, connId, STATE_ORDER, stateRank, effectiveState };
