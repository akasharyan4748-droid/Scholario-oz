#!/bin/bash
# Keep the Next.js server alive - restart if dead
cd /app/applet

# Check if server is responding
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
  echo "[$(date)] Server OK" >> /app/applet/watchdog.log
  exit 0
fi

# Server is down - kill any leftovers and restart
echo "[$(date)] Server down. Restarting..." >> /app/applet/watchdog.log
pkill -9 -f "server.js" 2>/dev/null
pkill -9 -f "next" 2>/dev/null
sleep 2

# Start the standalone server (low memory, ~600MB)
setsid bash -c 'cd /app/applet/.next/standalone && PORT=3000 exec node server.js' </dev/null >/app/applet/.next/dev.log 2>&1 &
sleep 5

# Verify it started
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
  echo "[$(date)] Server restarted successfully" >> /app/applet/watchdog.log
else
  echo "[$(date)] Server failed to start" >> /app/applet/watchdog.log
fi
