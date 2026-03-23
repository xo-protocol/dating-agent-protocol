/**
 * Quick script to get an XO Protocol access token via OAuth 2.0
 *
 * Usage: node scripts/get-token.js
 * → Opens browser for Google Sign-In
 * → Catches callback with auth code
 * → Exchanges for access token
 * → Prints token to stdout
 */

import http from 'http'
import { exec } from 'child_process'

const API_KEY = process.env.XO_API_KEY
const CLIENT_ID = process.env.XO_CLIENT_ID
const CLIENT_SECRET = process.env.XO_CLIENT_SECRET
const REDIRECT_URI = process.env.XO_REDIRECT_URI || 'http://localhost:3000/callback'
const SCOPES = process.env.XO_SCOPES || 'identity,connections,reputation,social_signals'

if (!API_KEY || !CLIENT_ID || !CLIENT_SECRET) {
  console.error('Required environment variables: XO_API_KEY, XO_CLIENT_ID, XO_CLIENT_SECRET')
  process.exit(1)
}

// Step 1: Start local server to catch the callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000')

  if (url.pathname !== '/callback') {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!code) {
    res.writeHead(400)
    res.end('No code received')
    return
  }

  console.log(`\nReceived auth code: ${code.substring(0, 20)}...`)

  // Step 3: Exchange code for token
  try {
    const tokenRes = await fetch('https://protocol.xoxo.space/protocol/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    })

    const data = await tokenRes.json()

    if (data.access_token) {
      console.log('\n=== SUCCESS ===')
      console.log(`Access Token: ${data.access_token}`)
      console.log(`Expires In: ${data.expires_in}s`)
      if (data.refresh_token) console.log(`Refresh Token: ${data.refresh_token}`)

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('<h1>Done!</h1><p>Token received. You can close this tab.</p>')
    } else {
      console.error('\nToken exchange failed:', JSON.stringify(data, null, 2))
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(`<h1>Error</h1><pre>${JSON.stringify(data, null, 2)}</pre>`)
    }
  } catch (err) {
    console.error('\nFetch error:', err.message)
    res.writeHead(500)
    res.end('Token exchange failed')
  }

  // Shutdown after handling
  setTimeout(() => {
    server.close()
    process.exit(0)
  }, 1000)
})

server.listen(3000, () => {
  const state = Math.random().toString(36).substring(2)
  const authUrl = `https://xoxo.space/en/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES}&state=${state}&response_type=code`

  console.log('Starting OAuth flow...')
  console.log(`\nOpen this URL in your browser:\n${authUrl}\n`)

  // Try to open browser automatically
  exec(`open "${authUrl}"`)
})
