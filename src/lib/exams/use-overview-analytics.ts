'use client'

import { useState, useEffect, useCallback } from 'react'

export interface OverviewAnalytics {
  hasResults: boolean
  latestExam: {
    id: string
    name: string
    type: string
    startDate: string | null
    endDate: string | null
  } | null
  analytics: {
    totalStudents: number
    passed: number
    failed: number
    passRate: number
    averagePercentage: number
    highestPercentage: number
    lowestPercentage: number
    gradeDistribution: Record<string, number>
    subjectPerformance: Array<{
      subjectId: string
      subjectName: string
      averageMarks: number
      averagePercentage: number
      entered: number
      total: number
    }>
  } | null
  toppers: Array<{
    rank: number
    studentId: string
    name: string
    rollNo: string | null
    className: string
    percentage: number
    grade: string
    total: number
    maxTotal: number
  }>
  className: string
  trend: Array<{ examName: string; averagePercentage: number; passRate: number }>
  declaredExamCount: number
  needsAttention: Array<{
    studentId: string
    name: string
    rollNo: string | null
    className: string
    percentage: number
    grade: string
  }>
}

export function useOverviewAnalytics(classId?: string | null) {
  const [data, setData] = useState<OverviewAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const url = `/api/exams/overview-analytics${classId ? `?classId=${classId}` : ''}`
    fetch(url, { credentials: 'include' })
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled && body.ok) setData(body.data)
        else if (!cancelled) setData(null)
      })
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [classId, reloadKey])

  return { data, loading, reload }
}
