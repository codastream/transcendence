#!/bin/bash

BASE_URL="https://localhost:4430"
WSBASE_URL="wss://localhost:4430"
WSAPI_URL="$WSBASE_URL/api"
API_URL="$BASE_URL/api"

CREATE_SESSION_URL="$API_URL/game/create-session"

RESPONSE=$(curl -k -b cookies.txt \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-user-name: admin" \
  -H "x-user-id: 1" \
  -d '{}' $CREATE_SESSION_URL 2>/dev/null)

SESSION_ID=$(echo "$RESPONSE" | jq -r '.sessionId' 2>/dev/null)
WS_URL="$WSBASE_URL/api/game/$SESSION_ID"
echo $WS_URL > /tmp/wsurl_transcendence
echo $SESSION_ID > /tmp/sessionid_transcendence
echo "WebSocket URL is $WS_URL" 
echo "SessionId is $SESSION_ID" 

