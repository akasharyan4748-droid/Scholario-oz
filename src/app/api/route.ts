import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/app-version";

/**
 * GET /api — lightweight health/version probe.
 * Replaces the scaffold "Hello, world!" route; doubles as an operational
 * heartbeat (service up + which version is serving).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { app: "SCHOLARIO-OS", status: "ok", version: APP_VERSION },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}