#!/usr/bin/env bash
set -e

cd /workspaces/Mail

if pgrep -f "next dev.*0.0.0.0" >/dev/null 2>&1; then
  exit 0
fi

nohup npm run dev -- -H 0.0.0.0 > /tmp/ai-mail-hub.log 2>&1 &
