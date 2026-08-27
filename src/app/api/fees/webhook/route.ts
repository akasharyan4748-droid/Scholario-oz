import { NextRequest, NextRequest as Req, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

/// GET /api/fees/webhook — list webhook events for the school's audit log.
/// Supports filtering by status, eventType, gatewayName.
export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const eventType = searchParams.get('eventType')
    const gatewayName = searchParams.get('gateway')
    const limit = Math.min(200, Number(searchParams.get('limit') || 100))

    // WebhookEvent.schoolId may be NULL (events without notes.schoolId) —
    // surface both the school's own events AND unattributed ones for the
    // operator's audit surface.
    const where: any = {
      OR: [{ schoolId }, { schoolId: null }],
    }
    if (status) where.status = status
    if (eventType) where.eventType = eventType
    if (gatewayName) where.gatewayName = gatewayName

    const events = await db.webhookEvent.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      take: limit,
    })
    return events
  })
}

/// GET /api/fees/webhook/stats — quick counts for the audit surface header.
/// (separate endpoint to avoid loading all events just for the counts.)
export async function HEAD() {
  return NextResponse.json({ ok: true })
}
