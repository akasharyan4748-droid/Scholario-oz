#!/bin/bash
# Auto-restart dev server with signal trapping
trap '' SIGHUP SIGTERM
cd /home/z/my-project
while true; do
  env NODE_OPTIONS="--max-old-space-size=256" bun run dev >> dev.log 2>&1 &
  PID=$!
  wait $PID 2>/dev/null
  echo "[watchdog] Server died at $(date), restarting in 2s..." >> dev.log
  sleep 2
done
