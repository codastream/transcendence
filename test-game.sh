#!/bin/bash

if ! command -v wscat &> /dev/null; then
  echo -e "${RED}❌ wscat is not installed${NC}"
  echo "Please install it with: npm install -g wscat"
  exit 1
fi

WSBASE_URL="ws://localhost:8080"
BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api"
WSAPI_URL="$WSBASE_URL/api"
GATEWAY_URL="$BASE_URL/public"

echo -e "\t\t\t🧪 Test game-service"
echo -e "========================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Authentificate user as admin -> creating cookie
echo -n "Creating new auth cookie as admin user... "
GAME_RESPONSE=$(curl -c cookies.txt -H "Content-Type: application/json" \
	-d '{"username":"admin","password":"Admin123!"}' \
	http://localhost:8080/api/auth/login \
	2>/dev/null)
TOKEN=$(grep token cookies.txt | awk '{print $7}')
GAME_RESPONSE=$(echo "$GAME_RESPONSE" | jq -r '.result.message' 2>/dev/null)
if [ "$GAME_RESPONSE" = "Login successful" ]; then
    echo -e "${GREEN}\t✅Login successful${NC}"
else
    echo -e "${RED}\t❌Login failed${NC}"
fi

# Create a new Game Session
echo -n "Create new game session... "
GAME_RESPONSE=$(curl -b cookies.txt \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-user-name: admin" \
  -H "x-user-id: 1" \
  -d '{}' \
  http://localhost:8080/api/game/create-session \
  2>/dev/null)
SESSION_ID=$(echo "$GAME_RESPONSE" | jq -r '.sessionId' 2>/dev/null)
WS_URL=$WSAPI_URL$(echo "$GAME_RESPONSE" | jq -r '.wsUrl' 2>/dev/null)
GAME_RESPONSE=$(echo "$GAME_RESPONSE" | jq -r '.status' 2>/dev/null)
if [ "$GAME_RESPONSE" = "success" ]; then
  echo -e "${GREEN}\t\t\t✅Game creation successful${NC}"
else
  echo -e "${RED}\t\t\t❌Game creation failed${NC}"
fi
echo -e "\tSession ID:\t$SESSION_ID\n\tWS_URL ID:\t$WS_URL"

# Connect to the Game Session
echo -n "Testing WebSocket connection..."

WS_OUTPUT=$({ echo "" & sleep 1; } | wscat -c "$WS_URL" -H "cookie: token=$TOKEN" 2>&1)
CONNECTION_STATUS=$(echo "$WS_OUTPUT" | jq -r '.type' 2>/dev/null)

if [ "$CONNECTION_STATUS" == "connected" ]; then
  echo -e "${GREEN}\t\t\t✅Connection successful${NC}"
else
  echo -e "${RED}\t\t\t❌Connection failed${NC}"
  echo -e "${RED}\tExpected message: {"type":"connected"...}${NC}"

fi
echo -e "\tServer answer:\t$WS_OUTPUT"

# Connect to wrong Game session
echo -n "Trying to connect to inexistante game session:"

WRONG_SESSION_ID="/game/wrong-session-id-1234"
WRONGWS_URL=$WSAPI_URL$WRONG_SESSION_ID
WS_OUTPUT=$({ echo "" & sleep 1; } | wscat -c "$WRONGWS_URL" -H "cookie: token=$TOKEN" 2>&1)
CONNECTION_STATUS=$(echo "$WS_OUTPUT" | jq -r '.type' 2>/dev/null)

if [ "$CONNECTION_STATUS" == "error" ]; then
  echo -e "${GREEN}\t✅Connection failed${NC}"
else
  echo -e "${RED}\t❌Connection failed${NC}"
  echo -e "${RED}\tExpected message: {"type":"error"...}${NC}"

fi
echo -e "\tServer answer:\t$WS_OUTPUT"

# Connect to the Game Session with invalid credential
echo -n "WebSocket connection with invalid credential:"
WRONG_TOKEN="12434asdsd"
WS_OUTPUT=$({ echo "" & sleep 2; } | wscat -c "$WS_URL" -H "cookie: token=$WRONG_TOKEN" 2>&1)
ERROR_CODE=$(echo "$WS_OUTPUT" | grep -o -E '[0-9]{3}')

if [ "$ERROR_CODE" == "401" ]; then
  echo -e "${GREEN}\t✅Invalid credential${NC}"
else
  echo -e "${RED}\t❌Test failed${NC}"
  echo -e "${RED}\tExpected message: error: Unexpected server response: 401${NC}"

fi
echo -e "\tServer answer:\t$WS_OUTPUT"

echo -n "Connect to deleted session"

WS_OUTPUT=$({ echo "" & sleep 1; } | wscat -c "$WS_URL" -H "cookie: token=$TOKEN" 2>&1)
CONNECTION_STATUS=$(echo "$WS_OUTPUT" | jq -r '.type' 2>/dev/null)

if [ "$CONNECTION_STATUS" == "error" ]; then
  echo -e "${GREEN}\t\t\t✅No game for this session${NC}"
else
  echo -e "${RED}\t\t\t❌Test failed${NC}"
  echo -e "${RED}\tExpected message: {"type":"connected"...}${NC}"

fi
echo -e "\tServer answer:\t$WS_OUTPUT"

exit 0
