/**
 * Single source of truth for the application version.
 *
 * Bump this whenever user-visible changes ship. The `/api/app-version`
 * endpoint serves it to clients, and <VersionGuard /> compares it against
 * the version baked into the loaded bundle — auto-reloading stale tabs
 * (e.g. a Preview Panel that has held an old in-memory SPA across a
 * server restart) so users always land on the latest build.
 */
export const APP_VERSION = "2.6.0";

/** Compact label for sidebar footers / login stamp, e.g. "SCHOLARIO v2.5". */
export const APP_VERSION_LABEL = `SCHOLARIO v${APP_VERSION.split(".").slice(0, 2).join(".")}`;
