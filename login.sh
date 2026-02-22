#!/bin/bash

RESPONSE=$(curl -k -v -X POST https://localhost:4430/api/auth/login \
  -c cookies.txt\
  -H "Content-Type: application/json" \
  -d '{"username":"invite","password":"Invite123!"}'\
  2>/dev/null)

TOKEN=$(grep token cookies.txt | awk '{print $7}')
echo $TOKEN > /tmp/token_transcendence
echo "Create cookie : $TOKEN"

