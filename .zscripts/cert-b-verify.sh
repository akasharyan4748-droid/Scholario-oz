#!/bin/bash
# cert-b-verify.sh v3 — retry-tolerant verification
export AGENT_BROWSER_SESSION=cert-b
cd /home/z/my-project
SHOTS=/home/z/my-project/screenshots
mkdir -p "$SHOTS"
E() { agent-browser eval "(() => { try { $1 } catch(e) { return 'EVAL-ERR: '+e.message } })()" 2>&1 | head -${2:-2}; }
OUT=/home/z/my-project/.zscripts/cert-b-result.txt
: > "$OUT"

start_server() {
  pkill -f "next dev" 2>/dev/null; sleep 1
  for attempt in 1 2 3 4 5 6 7 8; do
    setsid bash -c 'exec bun run dev > /home/z/my-project/dev.log 2>&1' < /dev/null &
    ok=0
    for i in $(seq 1 50); do
      code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 8)
      if [ "$code" = "200" ]; then ok=1; break; fi
      ps aux | grep -q "[n]ext dev" || break
      sleep 2
    done
    if [ $ok = 1 ]; then
      sleep 6
      curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 8 | grep -q 200 && { echo "server STABLE (attempt $attempt)"; return 0; }
    fi
    echo "server retry $attempt"
  done
  return 1
}

alive() { curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 6 | grep -q 200; }

run_flow() {
  echo "════════ LOGIN ════════"
  agent-browser open "http://localhost:3000/#portal" >/dev/null 2>&1
  sleep 6
  agent-browser find text "Principal" click 2>&1 | head -1
  sleep 1
  agent-browser find text "Sign In" click 2>&1 | head -1
  sleep 7
  local loggedin=$(E "return document.body.innerText.includes('Overview') || document.body.innerText.includes('Quick Actions') || document.body.innerText.includes('Welcome back') ? 'LOGGED IN' : 'NOT LOGGED IN'")
  echo "login: $loggedin" | tee -a "$OUT"
  [ "$loggedin" = "LOGGED IN" ] || return 1
  agent-browser screenshot "$SHOTS/cert-b-02-dashboard.png" >/dev/null

  echo "════════ OPEN MODULE ════════"
  E "const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Certificates'); if(b){b.click(); return 'nav clicked'} return 'NOT FOUND'"
  sleep 3
  local inmod=$(E "return document.body.innerText.includes('Live preview') ? 'IN MODULE' : 'NOT IN MODULE'")
  echo "module: $inmod" | tee -a "$OUT"
  [ "$inmod" = "IN MODULE" ] || return 1
  agent-browser screenshot "$SHOTS/cert-b-03-generate-default.png" >/dev/null

  echo "── default preview:"; E "const el=document.querySelector('.print-area'); return el ? el.innerText.replace(/\n/g,' | ').slice(0,400) : 'NO PRINT-AREA'" 3 | tee -a "$OUT"
  echo "── selected type:"; E "return [...document.querySelectorAll('button[aria-pressed]')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.innerText.split('\n')[0]).join(',') || 'NONE'" | tee -a "$OUT"
  echo "── stepper:"; E "return document.querySelector('[aria-label=\"Generation progress\"]')?.innerText.replace(/\n/g,' ') ?? 'NO STEPPER'" | tee -a "$OUT"

  echo "════════ SWITCH 6 TYPES ════════"
  for t in Transfer Character "ID Card" "Fee Receipt" Migration Marksheet; do
    echo "── $t:"; E "const b=[...document.querySelectorAll('button[aria-pressed]')].find(b=>b.innerText.startsWith('$t')); if(b){b.click(); return 'clicked'} return 'NOT FOUND'"
    sleep 2
    agent-browser screenshot "$SHOTS/cert-b-type-$(echo "$t" | tr ' ' '-').png" >/dev/null
    E "const el=document.querySelector('.print-area'); return '  preview: ' + (el ? el.innerText.replace(/\n/g,' | ').slice(0,160) : 'NO PRINT-AREA')" | tee -a "$OUT"
  done

  echo "════════ GENERATE BONAFIDE ════════"
  E "const b=[...document.querySelectorAll('button[aria-pressed]')].find(b=>b.innerText.startsWith('Bonafide')); if(b){b.click(); return 'back to bonafide'} return 'NOT FOUND'"
  sleep 2
  echo "── generate btn:"; E "const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim().startsWith('Generate Bonafide')); return b ? (b.disabled ? 'DISABLED' : 'ENABLED') : 'NOT FOUND'" | tee -a "$OUT"
  E "const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim().startsWith('Generate Bonafide')); if(b){b.click(); return 'generate clicked'} return 'NOT FOUND'"
  sleep 2
  agent-browser screenshot "$SHOTS/cert-b-04-generated-toast.png" >/dev/null
  echo "── toast:"; E "return [...document.querySelectorAll('[data-sonner-toast]')].map(t=>t.innerText.replace(/\n/g,' | ')).join(' ;; ') || 'NO TOAST'" | tee -a "$OUT"

  echo "════════ HISTORY ════════"
  E "const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='History'); if(b){b.click(); return 'history tab clicked'} return 'NOT FOUND'"
  sleep 2
  agent-browser screenshot "$SHOTS/cert-b-05-history.png" >/dev/null
  echo "── first 3 rows:"; E "return [...document.querySelectorAll('table tbody tr')].slice(0,3).map(r=>r.innerText.replace(/\t/g,'|').replace(/\n/g,'/')).join('\n')" 6 | tee -a "$OUT"
  echo "── mobile history card exists:"; E "return document.querySelector('md\\:hidden, .divide-y') ? 'cards-present' : 'no'" | tee -a "$OUT"

  echo "════════ PREVIEW FROM HISTORY ════════"
  echo "── open modal:"; E "const b=document.querySelector('button[title=\"Preview\"]'); if(b){b.click(); return 'preview clicked'} return 'NOT FOUND'"
  sleep 2
  agent-browser screenshot "$SHOTS/cert-b-06-history-preview-modal.png" >/dev/null
  echo "── modal content:"; E "const el=document.querySelector('.print-area'); return el ? el.innerText.replace(/\n/g,' | ').slice(0,260) : 'NO PRINT-AREA'" 3 | tee -a "$OUT"
  agent-browser press Escape >/dev/null 2>&1; sleep 1

  echo "════════ PRINT + DOWNLOAD ════════"
  echo "── print:"; E "const b=document.querySelector('button[title=\"Print\"]'); if(b){b.click(); return 'print clicked'} return 'NOT FOUND'"
  sleep 3
  echo "── download:"; E "const b=document.querySelector('button[title=\"Download\"]'); if(b){b.click(); return 'download clicked'} return 'NOT FOUND'"
  sleep 2
  agent-browser screenshot "$SHOTS/cert-b-07-after-download.png" >/dev/null
  echo "── toast:"; E "return [...document.querySelectorAll('[data-sonner-toast]')].map(t=>t.innerText.replace(/\n/g,' | ')).join(' ;; ') || 'NO TOAST'" | tee -a "$OUT"

  echo "════════ TEMPLATES ════════"
  E "const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Templates'); if(b){b.click(); return 'templates tab clicked'} return 'NOT FOUND'"
  sleep 2
  agent-browser screenshot "$SHOTS/cert-b-08-templates.png" >/dev/null
  echo "── headers:"; E "return [...document.querySelectorAll('h3')].map(h=>h.innerText).slice(0,10).join(' | ') || 'NONE'" | tee -a "$OUT"

  echo "════════ 390px ════════"
  E "const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Generate'); if(b){b.click(); return 'generate tab clicked'} return 'NOT FOUND'"
  sleep 1
  agent-browser set viewport 390 844 >/dev/null 2>&1
  sleep 2
  agent-browser screenshot "$SHOTS/cert-b-09-390px-generate.png" >/dev/null
  echo "── scrollWidth @390 generate:"; E "return document.documentElement.scrollWidth + ''" | tee -a "$OUT"
  E "const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='History'); if(b){b.click(); return 'history@390 clicked'} return 'NOT FOUND'"
  sleep 2
  agent-browser screenshot "$SHOTS/cert-b-10-390px-history.png" >/dev/null
  echo "── scrollWidth @390 history:"; E "return document.documentElement.scrollWidth + ''" | tee -a "$OUT"
  agent-browser set viewport 1280 720 >/dev/null 2>&1

  echo "════════ CONSOLE ════════"
  agent-browser console 2>&1 | rg -i "\[error\]|uncaught|typeerror|referenceerror" | head -15 | tee -a "$OUT"
  echo "── console scanned"
  return 0
}

echo "════════ PHASE 1: server ════════"
start_server || { echo "SERVER FAILED"; exit 1; }
agent-browser close 2>/dev/null

for run in 1 2 3; do
  echo "═══════════ FLOW RUN $run ═══════════"
  if run_flow; then
    echo "FLOW COMPLETE (run $run)"
    break
  else
    echo "flow run $run failed — restarting server"
    agent-browser close 2>/dev/null
    start_server || true
  fi
done
alive && echo "server still alive at end" || echo "server dead at end (restarting for others)"
alive || start_server
cat "$OUT"
