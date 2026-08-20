#!/bin/bash
# Dev server watchdog — keeps the server alive even if the parent shell exits.
cd /home/z/my-project

while true; do
  echo "[$(date)] Starting dev server..."
  bun run dev >> /home/z/my-project/dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE. Restarting in 3s..."
  sleep 3
done
