#!/bin/bash
cd /app/applet
while true; do
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "[$(date)] Server down. Restarting..." >> /app/applet/watchdog.log
    nohup bun run dev > /app/applet/dev.log 2>&1 &
    sleep 20
    if pgrep -f "next-server" > /dev/null 2>&1; then
      echo "[$(date)] Server started. Pre-compiling..." >> /app/applet/watchdog.log
      curl -s -o /dev/null http://localhost:3000/ 2>&1
      sleep 8
      curl -s -o /dev/null http://localhost:3000/ 2>&1
      sleep 3
      echo "[$(date)] Pre-compile done. Server ready." >> /app/applet/watchdog.log
    fi
  fi
  sleep 15
done
