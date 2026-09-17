#!/bin/bash
# BEFORE-capture for Task 2-a (Library polish)
# Starts dev server (sandbox kills background procs between tool calls),
# logs in as Principal, opens Library, captures desktop + mobile screenshots.
cd /home/z/my-project
(nohup bun run dev >> dev.log 2>&1 &)

# wait for server readiness
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$code" = "200" ]; then break; fi
  sleep 1
done
echo "server ready: $code"
sleep 3

S="agent-browser --session lib-a"
$S open http://localhost:3000/#portal >/dev/null 2>&1
sleep 12
# hydrate wait: portal text appears
for i in $(seq 1 20); do
  txt=$($S eval "document.body.innerText.length" 2>/dev/null)
  if [ "${txt:-0}" -gt 100 ]; then break; fi
  sleep 2
done
echo "portal hydrated: $txt chars"
$S eval "localStorage.removeItem('scholario-auth')" >/dev/null 2>&1
$S reload >/dev/null 2>&1
sleep 10
for i in $(seq 1 15); do
  txt=$($S eval "document.body.innerText.length" 2>/dev/null)
  if [ "${txt:-0}" -gt 100 ]; then break; fi
  sleep 2
done
# click Principal quick-access then Sign In
$S find role button click --name "Principal" >/dev/null 2>&1
sleep 1
$S find role button click --name "Sign In" >/dev/null 2>&1
sleep 10
for i in $(seq 1 20); do
  txt=$($S eval "document.body.innerText.includes('Dashboard') || document.body.innerText.includes('Quick')" 2>/dev/null)
  if [ "$txt" = "true" ]; then break; fi
  sleep 2
done
echo "logged in: $txt"

# navigate to Library via sidebar
$S find role button click --name "Library" >/dev/null 2>&1 || $S find text "Library" click >/dev/null 2>&1
sleep 8
for i in $(seq 1 15); do
  ok=$($S eval "document.body.innerText.includes('Book Catalogue') || document.body.innerText.includes('Catalogue')" 2>/dev/null)
  if [ "$ok" = "true" ]; then break; fi
  sleep 2
done
echo "library open: $ok"
$S screenshot /home/z/my-project/screenshots/lib-before-desktop.png
$S eval "document.documentElement.scrollWidth" > /tmp/sw-before.txt

# mobile viewport check
$S set viewport 390 844 >/dev/null 2>&1
sleep 3
$S eval "document.documentElement.scrollWidth" > /tmp/sw-before-mobile.txt
$S screenshot /home/z/my-project/screenshots/lib-before-mobile.png
echo "desktop scrollWidth: $(cat /tmp/sw-before.txt)"
echo "mobile scrollWidth: $(cat /tmp/sw-before-mobile.txt)"
$S console > /tmp/console-before.txt 2>&1
echo "console errors: $(grep -c '\[error\]' /tmp/console-before.txt || true)"
