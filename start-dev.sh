#!/bin/bash
cd /home/z/my-project
while true; do
  env NODE_OPTIONS="--max-old-space-size=256" bun run dev >> dev.log 2>&1 &
  PID=$!
  wait $PID
  sleep 2
done
