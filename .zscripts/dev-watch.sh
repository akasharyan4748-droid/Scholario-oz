#!/bin/bash
# Dev server watchdog — restarts next dev if it dies (OOM etc.)
cd /home/z/my-project
while true; do
  if ! curl -s -o /dev/null --max-time 5 http://localhost:3000/; then
    echo "$(date '+%H:%M:%S') dev server down — restarting" >> .zscripts/watchdog.log
    NODE_OPTIONS="--max-old-space-size=2560" nohup bun run dev > /dev/null 2>&1 &
    sleep 15
  fi
  sleep 20
done
