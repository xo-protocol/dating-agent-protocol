/**
 * DAP MCP Server
 *
 * Wraps DAP provider APIs as MCP tools for Claude Desktop and other MCP clients.
 * This allows a single AI agent to use DAP capabilities via MCP tool calls.
 *
 * Usage:
 *   node mcp-server.js
 *
 * Environment:
 *   DAP_PROVIDER_URL  - Provider API base URL (default: https://protocol.xo.social)
 *   DAP_API_KEY       - API key for the provider
 *   DAP_ACCESS_TOKEN  - OAuth access token for the authenticated principal
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const PROVIDER_URL = process.env.DAP_PROVIDER_URL || 'https://protocol.xo.social'
const API_KEY = process.env.DAP_API_KEY
const ACCESS_TOKEN = process.env.DAP_ACCESS_TOKEN

// --- HTTP helper ---

async function dapRequest(method, path, body = null) {
  const url = `${PROVIDER_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'Authorization': `Bearer ${ACCESS_TOKEN}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(`DAP API error ${res.status}: ${error.detail || error.title || res.statusText}`)
  }

  return res.json()
}

// --- MCP Server ---

const server = new McpServer({
  name: 'dap-social',
  version: '0.1.0'
})

// Tool 1: Verify Identity
server.tool(
  'verify_identity',
  'Check if the authenticated user is a verified human. Returns verification level, trust score, and sybil resistance — never personal information.',
  {},
  async () => {
    const result = await dapRequest('GET', '/dap/v1/identity/verify')
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    }
  }
)

// Tool 2: Discover Connections
server.tool(
  'discover_connections',
  'Find compatible people to connect with. Returns anonymous candidates with compatibility scores. No personal information is revealed at this stage.',
  {
    intents: z.array(z.string()).describe('What you are looking for: friendship, romance, conversation, emotional_support, activity_partner'),
    min_verification_level: z.enum(['none', 'basic', 'standard', 'strong', 'sovereign']).optional().describe('Minimum identity verification level'),
    languages: z.array(z.string()).optional().describe('Preferred languages (ISO 639-1 codes)'),
    regions: z.array(z.string()).optional().describe('Preferred regions (ISO 3166-1 alpha-2 codes)'),
    limit: z.number().optional().describe('Max candidates to return (default 10)')
  },
  async ({ intents, min_verification_level, languages, regions, limit }) => {
    const filters = {}
    if (min_verification_level) filters.min_verification_level = min_verification_level
    if (languages) filters.languages = languages
    if (regions) filters.regions = regions

    const result = await dapRequest('POST', '/dap/v1/discover', {
      schema: 'dap:discovery:request:v1',
      intents,
      filters,
      limit: limit || 10
    })

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    }
  }
)

// Tool 3: Initiate Consent
server.tool(
  'initiate_consent',
  'Send a connection request to a discovered candidate. This starts the staged consent process. The other person must also accept before any personal information is shared.',
  {
    target_token: z.string().describe('The principal_token of the candidate from discovery results'),
    requested_stage: z.enum(['match', 'reveal', 'identity', 'contact']).describe('The consent stage to request (must be one stage above current)')
  },
  async ({ target_token, requested_stage }) => {
    const result = await dapRequest('POST', '/dap/v1/consent/initiate', {
      schema: 'dap:consent:request:v1',
      target_token,
      requested_stage
    })

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    }
  }
)

// Tool 4: Check Consent Status
server.tool(
  'check_consent',
  'Check the status of a pending consent request or see all active connections and their current stages.',
  {
    request_id: z.string().optional().describe('Specific consent request ID to check. Omit to list all pending/active.')
  },
  async ({ request_id }) => {
    const path = request_id
      ? `/dap/v1/consent/${request_id}/status`
      : '/dap/v1/consent/pending'

    const result = await dapRequest('GET', path)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    }
  }
)

// Tool 5: Get Reputation
server.tool(
  'get_reputation',
  'Get the behavioral reputation of a connected user. Only available for users you have an active connection with (Stage 1+).',
  {
    principal_token: z.string().describe('The principal_token of the connected user')
  },
  async ({ principal_token }) => {
    const result = await dapRequest('GET', `/dap/v1/reputation/${principal_token}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    }
  }
)

// Tool 6: Break Ice (Conversation Aid)
server.tool(
  'break_ice',
  'Get contextual conversation starters for a connection at Stage 3+. Suggestions are based on shared interests — no conversation content is accessed.',
  {
    connection_id: z.string().describe('The connection_id from an active Stage 3+ connection')
  },
  async ({ connection_id }) => {
    const result = await dapRequest('POST', `/dap/v1/conversations/break-ice`, {
      connection_id
    })

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    }
  }
)

// --- Start ---

async function main() {
  if (!API_KEY || !ACCESS_TOKEN) {
    console.error('Error: DAP_API_KEY and DAP_ACCESS_TOKEN environment variables are required.')
    process.exit(1)
  }

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('DAP MCP Server running on stdio')
}

main().catch(console.error)
