#!/bin/bash
# Login debug flow (single command, server started inside)
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
  txt=$($S eval "document.body.innerText.length" 2>/dev/null)
  if [ "${txt:-0}" -gt 100 ]; then break; fi
  sleep 2
done
echo "portal hydrated: $txt"
$S eval "localStorage.clear()" >/dev/null 2>&1
$S open http://localhost:3000/#portal >/dev/null 2>&1
sleep 8
for i in $(seq 1 15); do
  txt=$($S eval "document.body.innerText.includes('Principal')" 2>/dev/null)
  if [ "$txt" = "true" ]; then break; fi
  sleep 2
done
echo "portal cards: $txt"
$S find role button click --name "Principal"
sleep 2
$S eval "var i=document.querySelector('input[type=email],input:not([type=password])'); var p=document.querySelector('input[type=password]'); (i?i.value:'no-email') + ' / ' + (p?p.value.length:0) + ' pw-chars'"
$S find role button click --name "Sign In"
sleep 12
echo "after signin: $($S eval "document.body.innerText.slice(0, 200).replace(/\n/g,' | ')")"
$S console 2>&1 | grep -iE "error|warn" | head -10
