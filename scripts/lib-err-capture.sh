#!/bin/bash
# Capture the actual error from the Next.js dev overlay after login crash
cd /home/z/my-project
(nohup bun run dev >> dev.log 2>&1 &)
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$code" = "200" ]; then break; fi
  sleep 1
done
echo "server ready: $code"
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
sleep 15
echo "--- page text ---"
$S eval "document.body.innerText.slice(0,150)"
echo "--- dev overlay ---"
$S eval "var p=document.querySelector('[data-nextjs-portal]'); p? p.shadowRoot.textContent.slice(0,2000) : 'no overlay'"
echo "--- window errors ---"
$S eval "(window.__NEXT_DEV_ERROR || null) ? 'has dev error obj' : 'no'"
$S console 2>&1 | tail -12
