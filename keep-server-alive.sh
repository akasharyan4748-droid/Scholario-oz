#!/bin/bash
cd /home/z/my-project
while true; do
  # Check if server is running
  if ! curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "[$(date)] Server not running. Starting..." >> /home/z/my-project/dev-watchdog.log
    bun run dev > /home/z/my-project/dev.log 2>&1 &
    PID=$!
    echo "[$(date)] Started with PID $PID" >> /home/z/my-project/dev-watchdog.log
    # Wait for it to be ready
    for i in $(seq 1 30); do
      if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
        echo "[$(date)] Server ready" >> /home/z/my-project/dev-watchdog.log
        break
      fi
      sleep 1
    done
  fi
  sleep 10
done
