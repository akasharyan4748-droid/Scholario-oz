#!/bin/bash
# Watchdog — restarts the dev server if it dies (e.g. OOM-killed).
# Uses `bun run dev` (NOT npx) to respect the project's bun setup.
cd /home/z/my-project
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ':3000 '; then
    echo "[$(date)] Starting bun run dev..."
    cd /home/z/my-project
    nohup setsid bash -c 'cd /home/z/my-project && exec bun run dev > /home/z/my-project/dev.log 2>&1' < /dev/null > /dev/null 2>&1 &
    disown
    sleep 8
  fi
  sleep 5
done
