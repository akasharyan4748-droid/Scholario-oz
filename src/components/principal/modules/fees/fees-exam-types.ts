'use client'

/**
 * fees-exam-types — bridge between the Fee Structure editor and the
 * Examination module (the SOURCE OF TRUTH for exam definitions).
 *
 * The Fee Structure's "Examination Fee Schedule" must NEVER invent its own
 * exam definitions. It can only configure a financial charge for exam
 * types that the Examination module has already configured for the school
 * (ExamTypeConfig rows, served by GET /api/exams/settings/types).
 *
 * This hook is intentionally tiny and read-only: it fetches the enabled
 * exam types once per mount. If the API is unreachable, it falls back to
 * the canonical EXAM_TYPES vocabulary so the editor still works offline
 * (with the same names the Examination module seeds by default).
 */

import { useState, useEffect } from 'react'
import { api } from '@/lib/exams/api-client'
import { EXAM_TYPES } from '@/lib/exams/types'

export interface ExamTypeDef {
  id: string
  name: string
  enabled: boolean
}

export function useExamTypeDefinitions(): {
  /** Enabled exam types configured in the Examination module. */
  types: ExamTypeDef[]
  loading: boolean
} {
  const [types, setTypes] = useState<ExamTypeDef[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api<ExamTypeDef[]>('/api/exams/settings/types')
      .then((d) => {
        if (cancelled) return
        const list = Array.isArray(d) ? d.filter((t) => t?.name && t.enabled !== false) : []
        if (list.length > 0) {
          setTypes(list)
        } else {
          setTypes(EXAM_TYPES.filter((n) => n !== 'Custom').map((name, i) => ({
            id: `fallback-${i}`, name, enabled: true,
          })))
        }
      })
      .catch(() => {
        if (cancelled) return
        // Offline fallback — the same default vocabulary the Examination
        // module auto-seeds (settings-service.listExamTypes).
        setTypes(EXAM_TYPES.filter((n) => n !== 'Custom').map((name, i) => ({
          id: `fallback-${i}`, name, enabled: true,
        })))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { types, loading }
}
