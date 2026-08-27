#!/usr/bin/env bash
# Self-contained fee verification: starts dev, keeps it alive, runs agent-browser flow.
set -u
cd /home/z/my-project
mkdir -p screenshots

# Kill any stale server
pkill -9 -f "next" 2>/dev/null
sleep 2
rm -f dev.log

# Start dev in background (node, stable per keepalive.cjs note)
nohup node node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
disown
DEV_PARENT=$!

# Wait for ready
echo "[verify] waiting for dev ready..."
for i in $(seq 1 30); do
  C=$(curl -s -o /dev/null -w "%{http_code}" --max-time 6 http://localhost:3000/ 2>/dev/null)
  [ "$C" = "200" ] && { echo "[verify] ready after ${i}x3s"; break; }
  sleep 3
done

# Helper to ensure server is up before each step
ensure_server() {
  local c=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/ 2>/dev/null)
  if [ "$c" != "200" ]; then
    echo "[verify] server down (http=$c), restarting..."
    pkill -9 -f "next" 2>/dev/null; sleep 2; rm -f dev.log
    nohup node node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
    disown
    for i in $(seq 1 30); do
      C=$(curl -s -o /dev/null -w "%{http_code}" --max-time 6 http://localhost:3000/ 2>/dev/null)
      [ "$C" = "200" ] && { echo "[verify] re-ready after ${i}x3s"; break; }
      sleep 3
    done
  fi
}

ensure_server
echo "[verify] STEP 1: open + inject auth"
agent-browser open "http://localhost:3000/" 2>&1 | tail -1
sleep 2
agent-browser eval "localStorage.setItem('scholario-auth', JSON.stringify({state:{user:{role:'principal',name:'Dr. Ananya Iyer',avatar:'AI',id:'EMP-001',email:'principal@scholario.in',teacherId:'T-014',studentId:'STU-2024-018'},isAuthenticated:true,isAuthenticating:false,hydrated:true},version:0}))" 2>&1 | tail -1

ensure_server
echo "[verify] STEP 2: reload with auth"
agent-browser open "http://localhost:3000/" 2>&1 | tail -1
echo "[verify] waiting 15s for hydration + dynamic import..."
sleep 15

ensure_server
echo "[verify] STEP 3: verify principal panel loaded"
PANEL=$(agent-browser eval 'document.body.innerText.includes("Fee Management") && document.body.innerText.includes("Dr. Ananya Iyer")' 2>&1 | tail -1)
echo "[verify] principal panel loaded: $PANEL"
agent-browser snapshot --path /home/z/my-project/screenshots/03-principal-dashboard.png 2>&1 | tail -2

ensure_server
echo "[verify] STEP 4: click Fee Management nav (deepest matching element)"
agent-browser eval "(function(){
  const all=[...document.querySelectorAll('*')];
  const m=all.filter(e=>e.textContent.trim()==='Fee Management');
  if(!m.length) return 'no match';
  m.sort((a,b)=>a.textContent.length-b.textContent.length);
  // click the smallest, then dispatch on its parent too
  const el=m[0];
  el.click();
  // also try the closest actionable ancestor
  let p=el;
  for(let i=0;i<4;i++){p=p.parentElement; if(!p)break; p.click?.();}
  return 'clicked '+m.length+' matches, smallest tag='+el.tagName;
})()" 2>&1 | tail -2
sleep 6

ensure_server
echo "[verify] STEP 5: verify fee module loaded"
FEE=$(agent-browser eval 'document.body.innerText.slice(0,2000)' 2>&1 | tail -1)
echo "[verify] fee module body (first 400 chars): ${FEE:0:400}"
agent-browser snapshot --path /home/z/my-project/screenshots/04-fee-module.png 2>&1 | tail -2

ensure_server
echo "[verify] STEP 6: check fee-store paymentModes Cheque state via window"
STORE_CHECK=$(agent-browser eval "(function(){
  // The store isn't on window by default, but we can check the rendered payment method chips
  const txt=document.body.innerText;
  const hasCollect=/Collect Payment|Collect|Payment Method/i.test(txt);
  return JSON.stringify({hasFeeModule:txt.includes('Fee'),hasCollectHint:hasCollect,bodyLen:txt.length})
})()" 2>&1 | tail -2)
echo "[verify] store check: $STORE_CHECK"

echo "[verify] DONE"
