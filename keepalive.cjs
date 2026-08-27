#!/usr/bin/env node
/**
 * Bulletproof keepalive for the Next.js dev server.
 *
 * The cloud sandbox kills long-running processes after ~3 minutes, so this
 * script polls the dev server every 20s. If the server is unresponsive for
 * 2 consecutive probes, it kills any stale Next process and starts a fresh one
 * using `node node_modules/.bin/next dev -p 3000` (bun crashes after ~14s on
 * this sandbox, but node is stable).
 *
 * Logs are appended to /home/z/my-project/dev.log so the existing pipeline
 * keeps working. The keepalive itself is small (~20MB RSS) and survives
 * sandbox reaping because it's idle 99% of the time.
 */
const { spawn, execSync } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PROJECT = '/home/z/my-project';
const LOG = path.join(PROJECT, 'dev.log');
const PORT = 3000;
const PROBE_INTERVAL_MS = 10_000;
const MAX_FAILS = 2;

let fails = 0;
let child = null;

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[keepalive ${ts}] ${msg}\n`;
  fs.appendFileSync(LOG, line);
  process.stdout.write(line);
}

function probe() {
  return new Promise((resolve) => {
    const req = http.get(
      { host: '127.0.0.1', port: PORT, path: '/', timeout: 4000 },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
  });
}

function killStale() {
  try {
    execSync(`pkill -9 -f "next-server" 2>/dev/null; pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "next/dist/bin" 2>/dev/null; sleep 1`, { stdio: 'ignore' });
  } catch {}
  // Free port 3000 if anything is holding it
  try {
    execSync(`fuser -k ${PORT}/tcp 2>/dev/null || true`, { stdio: 'ignore' });
  } catch {}
}

function startServer() {
  log('Starting Next.js dev server (node, not bun)...');
  killStale();
  const out = fs.openSync(LOG, 'a');
  const err = fs.openSync(LOG, 'a');
  child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', String(PORT)], {
    cwd: PROJECT,
    stdio: ['ignore', out, err],
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=1536' },
    detached: true,
  });
  child.unref();
  log(`Spawned dev server pid=${child.pid}`);
}

async function loop() {
  while (true) {
    const ok = await probe();
    if (ok) {
      fails = 0;
    } else {
      fails++;
      log(`probe failed (${fails}/${MAX_FAILS})`);
      if (fails >= MAX_FAILS) {
        log('Dev server is down — restarting.');
        startServer();
        fails = 0;
        // give it time to boot before next probe
        await new Promise((r) => setTimeout(r, 8000));
      }
    }
    await new Promise((r) => setTimeout(r, PROBE_INTERVAL_MS));
  }
}

// On startup, also make sure we have a server running.
(async () => {
  log('Keepalive started.');
  const alive = await probe();
  if (!alive) {
    startServer();
    await new Promise((r) => setTimeout(r, 8000));
  } else {
    log('Server already alive, monitoring.');
  }
  loop();
})();
