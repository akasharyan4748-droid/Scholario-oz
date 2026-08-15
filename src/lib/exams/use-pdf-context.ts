'use client'

import { useEffect, useState } from 'react'
import { api } from './api-client'
import type { SchoolContextDTO } from './types'

// Fetch school context (name, address, board, academicYear, logoUrl, etc.)
// Used by client-side PDF generators.
export function useSchoolContext() {
  const [data, setData] = useState<SchoolContextDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api<SchoolContextDTO>('/api/exams/school-context')
      .then((res) => {
        if (mounted) {
          setData(res)
          setError(null)
        }
      })
      .catch((e) => {
        if (mounted) setError(e?.message ?? 'Failed to load school info')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { data, loading, error }
}

// Sensible defaults used as fallback when config hasn't loaded yet.
// PDF generators fall back to these when school hasn't customized its settings.
export const DEFAULT_ADMIT_CARD_CONFIG = {
  showPhoto: true,
  showRollNumber: true,
  showRoom: true,
  showSeatNumber: true,
  showTimetable: true,
  showInstructions: true,
  showQrCode: false,
} as const

export const DEFAULT_REPORT_CARD_CONFIG = {
  showAttendance: true,
  showRank: true,
  showPercentage: true,
  showGrade: true,
  showCoScholastic: false,
  showRemarks: true,
  showClassTeacherSign: true,
  showPrincipalSign: true,
} as const
