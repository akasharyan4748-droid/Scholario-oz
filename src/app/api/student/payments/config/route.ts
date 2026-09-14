import { withUser, schoolScoped } from '@/lib/api'
import { getPaymentProvider } from '@/lib/payments/provider'

export const runtime = 'nodejs'

/// GET /api/student/payments/config
///
/// Capability probe for the student self-service checkout. Tells the UI
/// whether online payment is available at all, which provider is active
/// and (for Razorpay) the PUBLIC key id the browser needs for Razorpay
/// Checkout. Sandbox mode has no key — the confirmation is minted
/// server-side at /order time and relayed by the client to /verify.
///
/// Returns:
///   { available, provider: 'razorpay'|'sandbox'|null,
///     mode: 'live'|'test'|'sandbox'|null, keyId: string|null }
///
/// available=false → the UI must show "Online payment isn't available.
/// Please contact the school office." (outstanding amounts are computed
/// client-side from the fees list — no hint is returned here).
export async function GET() {
  return withUser(
    async (user) => {
      schoolScoped(user) // RLS — every student route is school-scoped

      const provider = getPaymentProvider()
      return {
        available: !!provider,
        provider: provider?.name ?? null,
        mode: provider?.mode ?? null,
        keyId: provider?.keyId ?? null,
      }
    },
    { roles: ['STUDENT'] }
  )
}
