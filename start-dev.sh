#!/bin/bash
# Dev server startup script — uses node directly (not bun) because bun
# exits after ~14 seconds in this sandbox environment.
cd /home/z/my-project
while true; do
  node /home/z/my-project/node_modules/.bin/next dev -p 3000 >> dev.log 2>&1
  echo "[watchdog] Server exited at $(date), restarting in 2s..." >> dev.log
  sleep 2
done
