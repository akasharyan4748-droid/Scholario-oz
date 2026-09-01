/**
 * APPS-FIN-LINK-1 — ONE-TIME demo-data hygiene constants (shared by BOTH the
 * applications-store v6 and fee-store v12 migrations).
 *
 * During the Applications & Forms rebuild session (2026-09-01) three throwaway
 * tour applications were created through intermediate dev builds. They persisted
 * into demo namespaces together with their linked Additional Charges and
 * application-bound payments, so Fee Management showed tour payments for forms
 * that no longer exist in the live module ("1 live tour, 3 tour payments").
 *
 * These records were TEST ARTIFACTS, not user data: dropping them restores the
 * demo dataset to exactly the canonical state — the seeded Jaipur tour
 * (APP-JAIPUR-2026 / AC-01) plus whatever was created through the shipped
 * builder (e.g. the Qutub Minar tour with its real payment).
 *
 * The ids are content-addressed (APP-/AC- + random suffix generated at create
 * time), so they can never collide with records created in any other tenant or
 * a fresh namespace — in production this migration is a no-op. Import-free by
 * design: both stores import this file, so no fee-store ⇄ applications-store
 * cycle is introduced.
 */

/** Stale dev-session tour applications to purge (kept: APP-JAIPUR-2026 seed
 *  and every application created through the shipped builder). */
export const STALE_APPLICATION_PURGE = {
  applicationIds: [
    'APP-mti6crrermo9l', // "Educational Tour — Agra Fort & Taj"
    'APP-mti4axsdthxum', // "Educational Tour — Science Museum"
    'APP-mti16m951gfop', // "Educational Tour — Nehru Planetarium"
  ],
  /** The Additional Charges auto-created at publish time by the tours above. */
  chargeIds: [
    'AC-mti6f1vs',
    'AC-mti4db7p',
    'AC-mti17uj5',
  ],
} as const
