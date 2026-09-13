import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/app-version";

/**
 * Lightweight version beacon consumed by <VersionGuard />.
 * Always served fresh (no-store) so no proxy or browser can pin an old value.
 */
export async function GET() {
  return NextResponse.json(
    {
      version: APP_VERSION,
      ts: Date.now(),
    },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    }
  );
}
