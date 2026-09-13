"use client";

import { useEffect, useRef } from "react";
import { APP_VERSION } from "@/lib/app-version";

/**
 * Self-healing staleness guard.
 *
 * Scholario-OS is a single-route SPA: once a browser tab has loaded the app,
 * it keeps running that bundle from memory — module switches never re-fetch
 * HTML. If the server restarts or a new version ships, such a tab would keep
 * showing a stale UI indefinitely (the classic "Preview shows an old
 * version" complaint). This guard fixes that class of issue for good:
 *
 * - On mount (shortly after load), when the tab regains focus, and every
 *   90s, it fetches `/api/app-version` (served no-store).
 * - If the server's version differs from the one baked into this bundle,
 *   the page reloads exactly once, pulling the latest build.
 *
 * Fetch failures (server briefly down / dev server restarting) are ignored
 * silently — a reload loop would be worse than a stale tab.
 */
export function VersionGuard() {
  const reloadingRef = useRef(false);

  useEffect(() => {
    let disposed = false;

    const check = async () => {
      if (reloadingRef.current || disposed) return;
      try {
        const res = await fetch("/api/app-version", { cache: "no-store" });
        if (!res.ok) return;
        const data: unknown = await res.json();
        const serverVersion =
          typeof data === "object" && data !== null && "version" in data
            ? String((data as { version: unknown }).version)
            : null;
        if (serverVersion && serverVersion !== APP_VERSION) {
          reloadingRef.current = true;
          window.location.reload();
        }
      } catch {
        /* server unreachable — try again on next tick, never force-reload */
      }
    };

    const initial = window.setTimeout(check, 3000);
    const interval = window.setInterval(check, 90_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      disposed = true;
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, []);

  return null;
}
