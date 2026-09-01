/**
 * Platform ADAPTER BOUNDARIES (SaaS-STAGE-2A).
 *
 * Scholario runs on MOCK infrastructure today with clean seams so each can
 * later be replaced by its production provider WITHOUT touching callers:
 *
 *   Mock Database        → Supabase / Postgres   (Prisma + API routes already
 *                                                  carry the server-side seam)
 *   Mock Email           → Resend                (EmailAdapter below)
 *   Mock Payment gateway → Razorpay / Cashfree   (PaymentGatewayAdapter below)
 *   Mock Storage         → production storage    (StorageAdapter below)
 *
 * Rules:
 *   - NO production credentials, NO fake environment variables pretending
 *     to be integrations. Adapters detect configuration via `isConfigured()`
 *     and fall back to the mock implementation.
 *   - The mock email adapter writes to a small localStorage outbox that the
 *     Platform Controls screen displays — proof that the seam is real and
 *     consumed (feature-change notifications), not decorative.
 */

// ─── Email ──────────────────────────────────────────────────────────────

export interface EmailInput {
  to: string
  subject: string
  body: string
  /** Logical template id, e.g. 'tenant.feature-changed'. */
  template?: string
  meta?: Record<string, string | number | boolean>
}

export interface EmailSendResult {
  id: string
  provider: 'mock' | 'resend'
}

export interface EmailAdapter {
  readonly provider: 'mock' | 'resend'
  readonly configured: boolean
  send(input: EmailInput): Promise<EmailSendResult>
}

const EMAIL_OUTBOX_KEY = 'scholario-platform-email-outbox'
const EMAIL_OUTBOX_LIMIT = 20

export interface OutboxEntry extends EmailInput {
  id: string
  at: string
  provider: 'mock' | 'resend'
}

export function readEmailOutbox(): OutboxEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(EMAIL_OUTBOX_KEY)
    return raw ? (JSON.parse(raw) as OutboxEntry[]) : []
  } catch {
    return []
  }
}

export function clearEmailOutbox(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(EMAIL_OUTBOX_KEY)
  } catch {
    // Ignore.
  }
}

function appendOutbox(entry: OutboxEntry): void {
  if (typeof window === 'undefined') return
  try {
    const next = [entry, ...readEmailOutbox()].slice(0, EMAIL_OUTBOX_LIMIT)
    window.localStorage.setItem(EMAIL_OUTBOX_KEY, JSON.stringify(next))
  } catch {
    // Best-effort mock outbox.
  }
}

const mockEmailAdapter: EmailAdapter = {
  provider: 'mock',
  configured: false,
  async send(input) {
    const result: EmailSendResult = { id: `eml-mock-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, provider: 'mock' }
    appendOutbox({ ...input, ...result, at: new Date().toISOString() })
    return result
  },
}

// A Resend adapter slots in here when RESEND_API_KEY exists (server-side
// route + key). Until then we deliberately keep the mock — no fake creds.
export function getEmailAdapter(): EmailAdapter {
  return mockEmailAdapter
}

// ─── Payment gateway ────────────────────────────────────────────────────

export interface GatewayOrderInput {
  /** Tenant whose gateway capability is in play (isolated per school). */
  tenantId: string
  amount: number
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

export interface GatewayOrder {
  orderId: string
  amount: number
  currency: string
  provider: 'mock' | 'razorpay'
}

export interface GatewayVerification {
  orderId: string
  paymentId: string
  verified: boolean
  provider: 'mock' | 'razorpay'
}

export interface PaymentGatewayAdapter {
  readonly provider: 'mock' | 'razorpay'
  readonly configured: boolean
  createOrder(input: GatewayOrderInput): Promise<GatewayOrder>
  verify(orderId: string, payload: Record<string, string>): Promise<GatewayVerification>
}

/**
 * Mock gateway — simulates order creation + auto-verification. The live
 * collect flow currently persists orders via /api/fees/orders (the
 * server-side seam); this adapter is the client-facing boundary the real
 * Razorpay checkout will replace. It is deliberately NOT wired into the
 * money path in this stage.
 */
const mockPaymentGateway: PaymentGatewayAdapter = {
  provider: 'mock',
  configured: false,
  async createOrder(input) {
    return {
      orderId: `order_mock_${Date.now().toString(36)}`,
      amount: input.amount,
      currency: input.currency ?? 'INR',
      provider: 'mock',
    }
  },
  async verify(orderId) {
    return { orderId, paymentId: `pay_mock_${Date.now().toString(36)}`, verified: true, provider: 'mock' }
  },
}

export function getPaymentGatewayAdapter(): PaymentGatewayAdapter {
  return mockPaymentGateway
}

// ─── Storage ────────────────────────────────────────────────────────────

export interface StorageAdapter {
  readonly provider: 'mock' | 'cloud'
  readonly configured: boolean
  put(key: string, data: Blob | string): Promise<{ key: string; url: string }>
  getUrl(key: string): Promise<string | null>
}

const mockStorage: StorageAdapter = {
  provider: 'mock',
  configured: false,
  async put(key, data) {
    if (typeof data === 'string') {
      try {
        window.localStorage.setItem(`scholario-storage-mock:${key}`, data)
      } catch {
        // Quota — mock storage is best-effort.
      }
    }
    return { key, url: `mock://${key}` }
  },
  async getUrl(key) {
    try {
      return window.localStorage.getItem(`scholario-storage-mock:${key}`)
    } catch {
      return null
    }
  },
}

export function getStorageAdapter(): StorageAdapter {
  return mockStorage
}

// ─── Registry (Platform Controls screen) ────────────────────────────────

export interface AdapterStatus {
  id: 'database' | 'email' | 'payment' | 'storage'
  label: string
  current: string
  target: string
  configured: boolean
}

export function getAdapterRegistry(): AdapterStatus[] {
  const email = getEmailAdapter()
  const payment = getPaymentGatewayAdapter()
  const storage = getStorageAdapter()
  return [
    { id: 'database', label: 'Database', current: 'Mock (zustand persist + Prisma/SQLite demo)', target: 'Supabase / Postgres', configured: false },
    { id: 'email', label: 'Email', current: `Mock outbox (${email.provider})`, target: 'Resend', configured: email.configured },
    { id: 'payment', label: 'Payment Gateway', current: `Mock gateway (${payment.provider})`, target: 'Razorpay / provider', configured: payment.configured },
    { id: 'storage', label: 'File Storage', current: `Mock (${storage.provider})`, target: 'Production storage', configured: storage.configured },
  ]
}
