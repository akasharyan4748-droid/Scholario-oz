#!/bin/bash
# Robust BEFORE capture: kill stale servers, start fresh, login, Library, shots.
cd /home/z/my-project
# kill any stale dev servers so we always start a fresh healthy one
pkill -f "next dev" 2>/dev/null; pkill -f "next-server" 2>/dev/null; pkill -f "bun run dev" 2>/dev/null
sleep 2
(nohup bun run dev >> dev.log 2>&1 &)
for i in $(seq 1 140); do
  code=$(curl -s -o /dev/null -m 8 -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$code" = "200" ]; then break; fi
  sleep 1
done
echo "server ready: $code"
if [ "$code" != "200" ]; then echo "SERVER FAILED"; exit 1; fi
S="agent-browser --session lib-a"
$S open http://localhost:3000/#portal >/dev/null 2>&1
sleep 12
for i in $(seq 1 15); do
  txt=$($S eval "document.body.innerText.includes('Principal')" 2>/dev/null)
  if [ "$txt" = "true" ]; then break; fi
  sleep 2
done
echo "portal: $txt"
$S find role button click --name "Principal" >/dev/null 2>&1
sleep 1
$S find role button click --name "Sign In" >/dev/null 2>&1
for i in $(seq 1 20); do
  txt=$($S eval "document.body.innerText.includes('Dashboard')" 2>/dev/null)
  if [ "$txt" = "true" ]; then break; fi
  sleep 2
done
echo "panel: $txt"
$S set viewport 1440 900 >/dev/null 2>&1
$S find role button click --name "Library" >/dev/null 2>&1 || $S find text "Library" click >/dev/null 2>&1
for i in $(seq 1 20); do
  ok=$($S eval "document.body.innerText.includes('Book Catalogue')" 2>/dev/null)
  if [ "$ok" = "true" ]; then break; fi
  sleep 2
done
echo "library: $ok"
$S screenshot /home/z/my-project/screenshots/lib-before-desktop.png
echo "desktop SW: $($S eval "document.documentElement.scrollWidth")"
$S find text "Issued" click >/dev/null 2>&1; sleep 2
$S screenshot /home/z/my-project/screenshots/lib-before-issued.png
$S find text "Overdue" click >/dev/null 2>&1; sleep 2
$S screenshot /home/z/my-project/screenshots/lib-before-overdue.png
$S find text "Reports" click >/dev/null 2>&1; sleep 2
$S screenshot /home/z/my-project/screenshots/lib-before-reports.png
$S find text "Fines" click >/dev/null 2>&1; sleep 2
$S screenshot /home/z/my-project/screenshots/lib-before-fines.png
$S find text "Catalogue" click >/dev/null 2>&1; sleep 1
$S set viewport 390 844 >/dev/null 2>&1
sleep 2
echo "mobile SW: $($S eval "document.documentElement.scrollWidth")"
$S screenshot /home/z/my-project/screenshots/lib-before-mobile.png
echo "console errors: $($S console 2>&1 | grep -ci '\[error\]' || true)"
