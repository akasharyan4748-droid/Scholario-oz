#!/bin/bash
while true; do
  if ! lsof -i:3000 > /dev/null 2>&1; then
    echo "[$(date)] Starting next dev..."
    cd /home/z/my-project
    npx next dev -p 3000 >> logs/dev.log 2>&1 &
    echo $! > logs/dev.pid
    sleep 5
  fi
  sleep 2
done
