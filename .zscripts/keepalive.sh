#!/bin/bash
# Super keepalive: pings every 2s AND restarts server if it dies
cd /home/z/my-project
while true; do
  if ! curl -s -o /dev/null --max-time 2 http://localhost:3000/logo.svg 2>/dev/null; then
    # Server is dead — restart it
    pkill -9 -f "next" 2>/dev/null; sleep 1
    bun run dev >> /home/z/my-project/dev.log 2>&1 &
    sleep 5
    curl -s -o /dev/null --max-time 30 http://localhost:3000/ 2>/dev/null
  fi
  sleep 2
done
