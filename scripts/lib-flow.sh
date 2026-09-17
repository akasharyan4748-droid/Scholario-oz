#!/bin/bash
# Shared-env-safe Library flow runner.
# - Reuses a healthy dev server if one is already up (other agents may own it).
# - Otherwise starts one (tracked via /tmp/lib-2a-dev.pid) WITHOUT killing others.
# Usage: bash lib-flow.sh <phase>   (phase = before | after)
PHASE="${1:-before}"
OUT="/home/z/my-project/screenshots"
mkdir -p "$OUT"
cd /home/z/my-project

# 1) reuse-or-start
code=$(curl -s -o /dev/null -m 8 -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
if [ "$code" != "200" ]; then
  (nohup bun run dev >> dev.log 2>&1 &)
  echo $! > /tmp/lib-2a-dev.pid
  for i in $(seq 1 150); do
    code=$(curl -s -o /dev/null -m 8 -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
    if [ "$code" = "200" ]; then break; fi
    sleep 1
  done
fi
echo "server ready: $code"
if [ "$code" != "200" ]; then echo "SERVER FAILED"; exit 1; fi

S="agent-browser --session lib-a"
# 2) ensure logged in as principal (skip if already in panel)
cur=$($S eval "document.body.innerText.includes('Dashboard')" 2>/dev/null)
if [ "$cur" != "true" ] || [ "$($S get url 2>/dev/null | grep -c localhost)" = "0" ]; then
  $S open http://localhost:3000/#portal >/dev/null 2>&1
  sleep 10
  for i in $(seq 1 15); do
    txt=$($S eval "document.body.innerText.includes('Principal')" 2>/dev/null)
    if [ "$txt" = "true" ] || [ "$($S eval "document.body.innerText.includes('Dashboard')" 2>/dev/null)" = "true" ]; then break; fi
    sleep 2
  done
  if [ "$($S eval "document.body.innerText.includes('Dashboard')" 2>/dev/null)" != "true" ]; then
    $S find role button click --name "Principal" >/dev/null 2>&1
    sleep 1
    $S find role button click --name "Sign In" >/dev/null 2>&1
  fi
  for i in $(seq 1 25); do
    txt=$($S eval "document.body.innerText.includes('Dashboard')" 2>/dev/null)
    if [ "$txt" = "true" ]; then break; fi
    sleep 2
  done
fi
echo "panel: $($S eval "document.body.innerText.includes('Dashboard')" 2>/dev/null)"

# 3) go to Library
$S set viewport 1440 900 >/dev/null 2>&1
$S find role button click --name "Library" >/dev/null 2>&1 || $S find text "Library" click >/dev/null 2>&1
for i in $(seq 1 20); do
  ok=$($S eval "document.body.innerText.includes('Book Catalogue')" 2>/dev/null)
  if [ "$ok" = "true" ]; then break; fi
  sleep 2
done
echo "library: $ok"
