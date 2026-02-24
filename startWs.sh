#!/bin/bash

WS_URL=$(cat /tmp/wsurl_transcendence)
TOKEN=$(cat /tmp/token_transcendence)
wscat -c "$WS_URL"\
	--no-check \
	-H "cookie: token=$TOKEN"

