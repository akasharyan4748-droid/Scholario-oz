'use client'

/**
 * Shim — the canonical timetable configuration now lives in
 * `@/lib/timetable/config` so EVERY role (Principal / Teacher / Student)
 * consumes the same structure + seed. This file re-exports it to keep the
 * Principal module's existing relative imports working unchanged.
 */
export * from '@/lib/timetable/config'
