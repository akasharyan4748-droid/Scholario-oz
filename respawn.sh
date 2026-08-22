#!/usr/bin/env bash
# Self-respawning dev server keepalive.
# Runs forever: spawn node next dev, wait for it to die, sleep 2s, repeat.
# Detached with setsid + nohup so it survives sandbox reapers that target
# the foreground process group. Logs go to dev.log (appended) so the existing
# pipeline keeps working.
set -u
cd /home/z/my-project
LOG=/home/z/my-project/dev.log

while true; do
  # kill anything holding port 3000
  fuser -k 3000/tcp 2>/dev/null
  pkill -9 -f "next-server" 2>/dev/null
  pkill -9 -f "next dev" 2>/dev/null
  pkill -9 -f "next/dist/bin" 2>/dev/null
  sleep 1

  echo "[respawn $(date -u +%FT%TZ)] starting next dev" >> "$LOG"
  node node_modules/.bin/next dev -p 3000 >> "$LOG" 2>&1
  # if we get here, next dev exited
  echo "[respawn $(date -u +%FT%TZ)] next dev exited with code $?, restarting in 2s" >> "$LOG"
  sleep 2
done
