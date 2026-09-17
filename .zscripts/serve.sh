#!/usr/bin/env bash
# Daemonized dev server launcher (double-fork via python) — survives the
# Bash tool's process-tree cleanup. Usage: bash .zscripts/serve.sh
if curl -s -o /dev/null --max-time 5 http://localhost:3000/; then
  echo "dev server already running"; exit 0
fi
python3 - <<'PYEOF'
import os, subprocess
def daemonize():
    if os.fork() > 0: os._exit(0)
    os.setsid()
    if os.fork() > 0: os._exit(0)
daemonize()
log = open('/home/z/my-project/dev.log', 'ab', buffering=0)
subprocess.Popen(['bun','run','dev'], cwd='/home/z/my-project',
    stdout=log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, start_new_session=True)
PYEOF
echo "dev server daemonized"
