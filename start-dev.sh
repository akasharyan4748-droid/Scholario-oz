#!/bin/bash
cd /home/z/my-project

while true; do
  # Start dev server with node (not bun — bun exits after 14s)
  node /home/z/my-project/node_modules/.bin/next dev -p 3000 >> dev.log 2>&1 &
  SERVER_PID=$!
  
  # Also ensure proxy is running
  if ! curl -s -o /dev/null --max-time 2 http://localhost:8081/ 2>&1; then
    node /home/z/my-project/proxy.cjs >> proxy.log 2>&1 &
    PROXY_PID=$!
  fi
  
  # Wait for server to be ready
  sleep 4
  
  # Pre-compile the page
  curl -s -o /dev/null --max-time 60 http://localhost:3000/ 2>&1
  
  # Wait for server to die
  wait $SERVER_PID 2>/dev/null
  
  # Kill proxy too
  kill $PROXY_PID 2>/dev/null
  
  echo "[restart] Server died, restarting in 2s..." >> dev.log
  sleep 2
done
