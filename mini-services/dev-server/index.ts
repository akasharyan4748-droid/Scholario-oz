import { spawn } from 'child_process'
import { writeFileSync, appendFileSync } from 'fs'

const LOG = '/home/z/my-project/dev.log'
const PORT = 3000

writeFileSync(LOG, `[${new Date().toISOString()}] Dev server mini-service starting...\n`)

function startServer() {
  appendFileSync(LOG, `[${new Date().toISOString()}] Starting bun run dev...\n`)
  
  const child = spawn('bun', ['run', 'dev'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })

  child.stdout.on('data', (data) => {
    appendFileSync(LOG, data.toString())
  })

  child.stderr.on('data', (data) => {
    appendFileSync(LOG, data.toString())
  })

  child.on('exit', (code) => {
    appendFileSync(LOG, `[${new Date().toISOString()}] Server exited with code ${code}. Restarting in 3s...\n`)
    setTimeout(startServer, 3000)
  })

  child.unref()
  appendFileSync(LOG, `[${new Date().toISOString()}] Server started with PID ${child.pid}\n`)
}

startServer()

// Keep this process alive
setInterval(() => {
  appendFileSync(LOG, `[${new Date().toISOString()}] Watchdog alive\n`)
}, 30000)
