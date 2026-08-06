#!/bin/bash
# Robust dev server launcher — survives shell session termination
set -e

PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/logs/dev.log"
PID_FILE="$PROJECT_DIR/logs/dev.pid"

cd "$PROJECT_DIR"
mkdir -p logs

# Kill any existing dev server
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "[launcher] Killing existing dev server (PID $OLD_PID)"
    kill -- -"$OLD_PID" 2>/dev/null || kill "$OLD_PID" 2>/dev/null || true
    sleep 2
  fi
fi
pkill -9 -f "next/dist/bin/next dev" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true
sleep 1

> "$LOG_FILE"

# Launch dev server fully detached in its own session
setsid -f bash -c "
  cd '$PROJECT_DIR'
  exec node --max-old-space-size=4096 node_modules/next/dist/bin/next dev -p 3000 > '$LOG_FILE' 2>&1
" &
SCRIPT_PID=$!

sleep 3

NEXT_PID=$(pgrep -f "next/dist/bin/next dev" | head -1)
if [ -z "$NEXT_PID" ]; then
  echo "[launcher] ERROR: dev server failed to start"
  tail -20 "$LOG_FILE"
  exit 1
fi

echo "$NEXT_PID" > "$PID_FILE"
echo "[launcher] Started dev server (next PID: $NEXT_PID)"

for i in $(seq 1 30); do
  if grep -q "Ready in" "$LOG_FILE" 2>/dev/null; then
    echo "[launcher] Dev server ready after ${i}s"
    break
  fi
  if ! kill -0 "$NEXT_PID" 2>/dev/null; then
    echo "[launcher] ERROR: dev server died during startup"
    tail -30 "$LOG_FILE"
    exit 1
  fi
  sleep 1
done

if ss -tln 2>/dev/null | grep -q ":3000 "; then
  echo "[launcher] Port 3000 is listening"
else
  echo "[launcher] WARNING: Port 3000 not yet listening, giving it more time..."
  sleep 5
fi

echo "[launcher] Recent log:"
tail -10 "$LOG_FILE"
echo ""
echo "[launcher] SUCCESS: dev server running on PID $NEXT_PID"
