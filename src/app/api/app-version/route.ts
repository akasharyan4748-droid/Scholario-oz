import { NextResponse } from 'next/server'
import { APP_VERSION } from '@/lib/app-version'

/**
 * GET /api/app-version — VersionGuard endpoint.
 *
 * Returns the authoritative, server-side APP_VERSION with `no-store`
 * semantics so no intermediary or browser cache can pin an old value.
 * The client-side <VersionGuard /> polls this endpoint and hard-reloads
 * any tab still running a stale bundle (see
 * src/components/shared/version-guard.tsx).
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    { version: APP_VERSION },
    { headers: {
      'Cache-Control': 'no-store, max-age=0',
    } }
  )
}
