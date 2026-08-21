#!/bin/bash
# Auto-restart dev server using node directly (not bun, which exits after 14s)
# This script keeps the server alive by restarting it whenever it dies.
cd /home/z/my-project
while true; do
  node /home/z/my-project/node_modules/.bin/next dev -p 3000 >> dev.log 2>&1
  echo "[watchdog] Server exited at $(date), restarting in 2s..." >> dev.log
  sleep 2
done
