'use client'

/**
 * Shim — the canonical timetable store now lives in
 * `@/lib/store/timetable-store` so EVERY role (Principal / Teacher /
 * Student) subscribes to the SAME source of truth (live-sync contract:
 * Principal publishes → students/teachers reflect the change).
 * This file re-exports it to keep the Principal module's existing relative
 * imports working unchanged.
 */
export * from '@/lib/store/timetable-store'
