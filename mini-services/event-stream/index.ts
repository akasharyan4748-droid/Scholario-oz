/**
 * SCHOLARIO-OS — Real-time Event Stream Service
 * ----------------------------------------------
 * Broadcasts genuine database events (fee payments, announcements,
 * admissions) to connected dashboards over socket.io.
 *
 * Strategy: lightweight poller over the shared SQLite file (bun:sqlite).
 * Every POLL_MS it looks for rows created since the last tick and emits
 * `school-event` frames to all clients (clients filter by their own
 * schoolId on the frontend, keeping the service auth-agnostic).
 *
 * Port: 3003 (reached via gateway as /?XTransformPort=3003)
 */
import { createServer } from 'http'
import { Server } from 'socket.io'
import { Database } from 'bun:sqlite'

const PORT = 3003
const POLL_MS = 4000
const DB_PATH = new URL('../../db/custom.db', import.meta.url).pathname

// ─── socket.io bootstrap (path '/' is required by the Caddy gateway) ───
const httpServer = createServer((_req, res) => {
  // Plain HTTP health probe
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true, service: 'event-stream', ts: new Date().toISOString() }))
})

const io = new Server(httpServer, {
  // DO NOT change the path — Caddy forwards /?XTransformPort=3003 here
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60_000,
  pingInterval: 25_000,
})

// ─── SQLite (read-only) ───
let sqlite: Database | null = null
try {
  sqlite = new Database(DB_PATH, { readonly: true })
  console.log(`[event-stream] attached SQLite at ${DB_PATH}`)
} catch (e) {
  console.error('[event-stream] FATAL: cannot open SQLite', e)
}

// Boot marker — only stream rows created after this service started,
// so clients never get a flood of historical rows.
// NOTE: Prisma stores DateTime as epoch-millis INTEGER in SQLite.
const bootAt = Date.now()
let lastMs: number = bootAt
// Dedupe guard — second-precision timestamps could re-emit the same row
const seen = new Set<string>()
const markAndCheck = (key: string) => {
  if (seen.has(key)) return false
  seen.add(key)
  if (seen.size > 5000) {
    // keep memory bounded — drop the oldest half
    const it = seen.values()
    for (let i = 0; i < 2500; i++) seen.delete(it.next().value)
  }
  return true
}
// Prisma epoch-millis → ISO string for wire frames
const msToIso = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) ? new Date(n).toISOString() : new Date().toISOString()

interface StreamEvent {
  kind: 'payment' | 'announcement' | 'admission'
  schoolId: string
  title: string
  detail: string
  amount?: number
  method?: string
  at: string
}

// ─── Poller ───
async function poll() {
  if (!sqlite) return
  try {
    // 1) Successful fee payments
    const payments = sqlite
      .query(
        `SELECT p.id, p.amount, p.method, p.createdAt AS ts,
                u.name AS student, f.title AS feeTitle, f.schoolId AS schoolId
         FROM Payment p
         JOIN Fee f ON f.id = p.feeId
         JOIN Student st ON st.id = f.studentId
         JOIN User u ON u.id = st.userId
         WHERE p.status = 'SUCCESS' AND p.createdAt > ?
         ORDER BY p.createdAt ASC LIMIT 20`
      )
      .all(lastMs) as Array<{
        id: string; amount: number; method: number | string; ts: number;
        student: string; feeTitle: string; schoolId: string
      }>

    for (const p of payments) {
      if (!markAndCheck(`payment:${p.id}`)) continue
      const evt: StreamEvent = {
        kind: 'payment',
        schoolId: p.schoolId,
        title: 'Fee payment received',
        detail: `${p.student} · ${p.feeTitle}`,
        amount: p.amount,
        method: String(p.method),
        at: msToIso(p.ts),
      }
      io.emit('school-event', evt)
      console.log(`[event-stream] payment → ${p.student} ₹${p.amount} (${p.method})`)
    }

    // 2) New school announcements
    const notices = sqlite
      .query(
        `SELECT n.id, n.title, n.message, n.schoolId, n.createdAt AS ts
         FROM Notification n
         WHERE n.createdAt > ?
         ORDER BY n.createdAt ASC LIMIT 10`
      )
      .all(lastMs) as Array<{ id: string; title: string; message: string; schoolId: string; ts: number }>

    for (const n of notices) {
      if (!markAndCheck(`notice:${n.id}`)) continue
      const evt: StreamEvent = {
        kind: 'announcement',
        schoolId: n.schoolId,
        title: n.title,
        detail: n.message.slice(0, 120),
        at: msToIso(n.ts),
      }
      io.emit('school-event', evt)
      console.log(`[event-stream] announcement → ${n.title}`)
    }

    // 3) Admissions: no Admission table exists (admissions module is client-mock)
    // — payments + announcements cover the live stream for now.

    // advance the watermark so the next poll only sees strictly newer rows
    if (payments.length || notices.length) {
      const newest = sqlite.query(
        `SELECT MAX(x) AS m FROM (
           SELECT MAX(p.createdAt) AS x FROM Payment p WHERE p.status='SUCCESS'
           UNION ALL SELECT MAX(n.createdAt) FROM Notification n
         )`
      ).get() as { m: number | null }
      if (typeof newest?.m === 'number') lastMs = newest.m
    }
  } catch (e) {
    console.error('[event-stream] poll error', e)
  }
}

io.on('connection', (socket) => {
  console.log(`[event-stream] client connected: ${socket.id}`)
  socket.emit('hello', { ok: true, serverTime: new Date().toISOString(), since: new Date(lastMs).toISOString() })
  socket.on('disconnect', () => console.log(`[event-stream] client gone: ${socket.id}`))
  socket.on('error', (e) => console.error(`[event-stream] socket error (${socket.id})`, e))
})

httpServer.listen(PORT, () => {
  console.log(`[event-stream] listening on :${PORT} (streaming events since ${new Date(lastMs).toISOString()})`)
  setInterval(poll, POLL_MS)
  // one quick pass shortly after boot to pick up anything racing the start
  setTimeout(poll, 1500)
})

process.on('SIGTERM', () => { httpServer.close(); process.exit(0) })
process.on('SIGINT', () => { httpServer.close(); process.exit(0) })
