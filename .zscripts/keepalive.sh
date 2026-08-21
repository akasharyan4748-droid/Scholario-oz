#!/bin/bash
cd /home/z/my-project
while true; do
  if ! curl -s -o /dev/null --max-time 2 http://localhost:3000/logo.svg 2>/dev/null; then
    # Server is dead — restart PRODUCTION standalone server (NOT dev server)
    pkill -9 -f "server.js" 2>/dev/null
    pkill -9 -f "next" 2>/dev/null
    sleep 1
    NODE_ENV=production node .next/standalone/server.js >> /home/z/my-project/dev.log 2>&1 &
    sleep 3
  fi
  sleep 2
done
