'use client'

/** Student Directory (TWC-QA) — shared types + the module's data hook. */

import { useEffect, useMemo, useState } from 'react'
import { signOut } from '@/lib/signout'

// ─── API contract ─────────────────────────────────────────────────────

export interface DirectoryStudent {
  id: string
  name: string
  email: string
  rollNo: string | null
  admissionNo: string | null
  guardianName: string | null
  guardianPhone: string | null
  dob: string | null
  gender: string | null
  bloodGroup: string | null
  address: string | null
  attendancePct: number | null
  attendanceRecords: number
  recentAttendance: { date: string; status: string }[]
}

export interface DirectoryClass {
  id: string
  label: string
  isClassTeacher: boolean
  subjects: string[]
  studentCount: number
}

export interface DirectoryPayload {
  classes: DirectoryClass[]
  studentsByClass: Record<string, DirectoryStudent[]>
}

// ─── envelope fetch (house pattern) ───────────────────────────────────

async function directoryFetch(): Promise<DirectoryPayload> {
  const res = await fetch('/api/teacher/students', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
  if (res.status === 401) {
    void signOut()
    throw new Error('Your session has expired. Please sign in again.')
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  const body = (await res.json()) as { ok?: boolean; data?: DirectoryPayload; error?: string }
  if (!body.ok || !body.data) throw new Error(body.error || 'Failed to load the student directory')
  return body.data
}

// ─── module hook: one fetch + selected class ─────────────────────────

export function useStudentDirectory() {
  const [data, setData] = useState<DirectoryPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [classId, setClassId] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    directoryFetch()
      .then((payload) => {
        if (cancelled) return
        setData(payload)
        // Default = the class-teacher class, else the first assigned class.
        setClassId((prev) => {
          if (prev && payload.classes.some((c) => c.id === prev)) return prev
          return payload.classes.find((c) => c.isClassTeacher)?.id ?? payload.classes[0]?.id ?? null
        })
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
    return () => { cancelled = true }
  }, [reload])

  const activeClass = useMemo(
    () => data?.classes.find((c) => c.id === classId) ?? null,
    [data, classId],
  )
  const students = useMemo(
    () => (classId ? data?.studentsByClass[classId] ?? [] : []),
    [data, classId],
  )

  return {
    data,
    error,
    reload: () => setReload((r) => r + 1),
    classId,
    setClassId,
    activeClass,
    students,
  }
}
