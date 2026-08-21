#!/bin/bash
# Keep the dev server alive by pinging it every 3 seconds
# Pings a static asset to avoid triggering route re-compilation
while true; do
  curl -s -o /dev/null --max-time 2 http://localhost:3000/logo.svg 2>/dev/null
  sleep 3
done
