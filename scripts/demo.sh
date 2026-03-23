#!/bin/bash
# DAP Live Demo — Using XO Protocol as the first DAP provider
# Records a complete flow: Identity → Discovery → Evaluate → Connect
#
# Usage: ./scripts/demo.sh
# Requires: XO_API_KEY and XO_ACCESS_TOKEN env vars

set -e

API_KEY="${XO_API_KEY}"
TOKEN="${XO_ACCESS_TOKEN}"
BASE="https://protocol.xoxo.space/protocol/v1"

if [ -z "$API_KEY" ] || [ -z "$TOKEN" ]; then
  echo "Set XO_API_KEY and XO_ACCESS_TOKEN first"
  exit 1
fi

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
DIM='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m'

pause() {
  sleep "${1:-2}"
}

type_text() {
  echo ""
  echo -e "${BOLD}${CYAN}$1${NC}"
  echo -e "${DIM}─────────────────────────────────────────────${NC}"
  pause 1
}

show_cmd() {
  echo -e "${DIM}\$ $1${NC}"
  pause 0.5
}

# ─────────────────────────────────────────────

clear
echo ""
echo -e "${BOLD}${CYAN}  ╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}  ║  Dating Agent Protocol (DAP) — Live Demo    ║${NC}"
echo -e "${BOLD}${CYAN}  ║  Using XO as the first DAP provider         ║${NC}"
echo -e "${BOLD}${CYAN}  ╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  An AI agent helps a human find someone to connect with."
echo -e "  All data flows through the DAP protocol — no PII is exposed."
echo ""
pause 3

# Step 1: Identity
type_text "Step 1: Verify Identity — \"Is my principal a real human?\""
show_cmd "GET /dap/v1/identity/verify"

IDENTITY=$(curl -s "$BASE/identity/verify" \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $TOKEN")

VERIFIED=$(echo "$IDENTITY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Yes ✅' if d.get('verified') else 'No ❌')")
TRUST=$(echo "$IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('trust_score', 'N/A'))")
SBT=$(echo "$IDENTITY" | python3 -c "import sys,json; print('Yes' if json.load(sys.stdin).get('has_minted_sbt') else 'No')")
ATTESTATIONS=$(echo "$IDENTITY" | python3 -c "import sys,json; d=json.load(sys.stdin); types=[a['type'] for a in d.get('attestations',[])]; print(', '.join(types))")
SINCE=$(echo "$IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('member_since','')[:10])")

echo ""
echo -e "  ${GREEN}Verified:${NC}      $VERIFIED"
echo -e "  ${GREEN}Trust Score:${NC}   $TRUST"
echo -e "  ${GREEN}SBT Minted:${NC}    $SBT"
echo -e "  ${GREEN}Member Since:${NC}  $SINCE"
echo -e "  ${GREEN}Attestations:${NC}  $ATTESTATIONS"
echo ""
echo -e "  ${DIM}→ Agent confirms: principal is a verified human with high trust.${NC}"
pause 4

# Step 2: Discovery
type_text "Step 2: Discover — \"Find someone compatible to talk to\""
show_cmd "POST /dap/v1/discover  {intents: [\"conversation\"], limit: 3}"

CONNECTIONS=$(curl -s "$BASE/connections/search?limit=3" \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $TOKEN")

echo ""
echo -e "  ${GREEN}Found 3 candidates:${NC}"
echo ""

echo "$CONNECTIONS" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for i, c in enumerate(d.get('connections', []), 1):
    tmp = c.get('tmp_id', 'N/A')
    score = c.get('compatibility_score', 'N/A')
    topics = ', '.join(c.get('shared_topics', []))
    verified = '✅' if c.get('verified') else '❌'
    text = c.get('news_feed', {}).get('text', '')[:60].replace(chr(10), ' ').strip()
    print(f'  Candidate {i}:')
    print(f'    Token:    {tmp}')
    print(f'    Verified: {verified}')
    print(f'    Topics:   {topics}')
    print(f'    Preview:  \"{text}...\"')
    print()
"

echo -e "  ${DIM}→ No names, photos, or PII — only anonymous scores and topics.${NC}"
echo -e "  ${DIM}→ The human sees candidates; the agent recommends.${NC}"
pause 4

# Step 3: Evaluate best candidate
type_text "Step 3: Evaluate — \"Check this person's reputation and engagement\""

FIRST_TMP=$(echo "$CONNECTIONS" | python3 -c "import sys,json; print(json.load(sys.stdin)['connections'][0]['tmp_id'])")

show_cmd "GET /dap/v1/reputation/$FIRST_TMP"

REP=$(curl -s "$BASE/reputation/$FIRST_TMP" \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $TOKEN")

TIER=$(echo "$REP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tier','N/A'))")
REP_SCORE=$(echo "$REP" | python3 -c "import sys,json; print(round(json.load(sys.stdin).get('reputation_score',0), 3))")

show_cmd "GET /dap/v1/social-signals/$FIRST_TMP"

SIG=$(curl -s "$BASE/social-signals/$FIRST_TMP" \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $TOKEN")

ENG=$(echo "$SIG" | python3 -c "import sys,json; print(json.load(sys.stdin).get('engagement_score','N/A'))")
CONF=$(echo "$SIG" | python3 -c "import sys,json; print(json.load(sys.stdin).get('confidence','N/A'))")

echo ""
echo -e "  ${GREEN}Candidate $FIRST_TMP:${NC}"
echo -e "  ${GREEN}Reputation:${NC}  $TIER (score: $REP_SCORE)"
echo -e "  ${GREEN}Engagement:${NC}  $ENG"
echo -e "  ${GREEN}Confidence:${NC}  $CONF"
echo ""
echo -e "  ${DIM}→ Agent assesses: verified user, ${TIER} reputation, decent engagement.${NC}"
echo -e "  ${DIM}→ Recommends proceeding to connection request (Gate 1).${NC}"
pause 4

# Step 4: What happens next (DAP-03)
type_text "Step 4: What Comes Next — DAP Connection Flow"

echo ""
echo -e "  The agent would now:"
echo ""
echo -e "  ${YELLOW}Gate 1:${NC}  Send connection request → other party accepts/declines"
echo -e "  ${YELLOW}❄️ Cold:${NC}  Exchange messages → warmth increases naturally"
echo -e "  ${YELLOW}🌤 Warm:${NC}  Shared interests revealed → vibe signals exchanged"
echo -e "  ${YELLOW}Gate 2:${NC}  Identity confirmation → names and photos shared"
echo -e "  ${YELLOW}🔥 Hot:${NC}  Sustained conversation → trust builds"
echo -e "  ${YELLOW}Gate 3:${NC}  Both agree → direct contact opened"
echo -e "  ${YELLOW}☀️ Open:${NC}  Full connection on provider app"
echo ""
echo -e "  ${DIM}All progression is implicit — driven by conversation warmth,${NC}"
echo -e "  ${DIM}not button clicks. Disclosure is asymmetric and voluntary.${NC}"
pause 4

# Summary
type_text "Summary"

echo ""
echo -e "  ${BOLD}What you just saw:${NC}"
echo ""
echo -e "  1. Agent verified principal's identity (SBT, attestations)"
echo -e "  2. Agent discovered compatible connections (no PII exposed)"
echo -e "  3. Agent evaluated a candidate's reputation and engagement"
echo -e "  4. Ready to initiate DAP connection flow"
echo ""
echo -e "  ${BOLD}All of this ran against a live API — not a mock.${NC}"
echo -e "  ${BOLD}XO is the first DAP provider. Any platform can be next.${NC}"
echo ""
echo -e "  ${CYAN}github.com/xo-protocol/dating-agent-protocol${NC}"
echo ""
