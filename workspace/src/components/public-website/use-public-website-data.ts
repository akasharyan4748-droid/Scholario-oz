'use client'

import { useState, useEffect } from 'react'
import type { PublicSchoolData } from './types'

export function usePublicSchoolData() {
  const [schoolData, setSchoolData] = useState<PublicSchoolData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPublicData() {
      try {
        const res = await fetch('/api/schools/public?slug=demo-school')
        const isJson = res.headers.get('content-type')?.includes('application/json')
        if (res.ok && isJson) {
          const json = await res.json().catch(() => ({}))
          if (json.success && json.data) {
            setSchoolData(json.data)
          }
        }
      } catch (e) {
        console.error('Failed to load public school data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchPublicData()
  }, [])

  return { schoolData, loading }
}

export interface AdmissionFormState {
  studentName: string
  parentName: string
  email: string
  phone: string
  grade: string
  notes: string
}

const initialAdmissionForm: AdmissionFormState = {
  studentName: '',
  parentName: '',
  email: '',
  phone: '',
  grade: 'Grade 1',
  notes: '',
}

export function useAdmissionForm() {
  const [admForm, setAdmForm] = useState<AdmissionFormState>(initialAdmissionForm)
  const [admSubmitting, setAdmSubmitting] = useState(false)
  const [admSuccess, setAdmSuccess] = useState(false)
  const [admError, setAdmError] = useState('')

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdmSubmitting(true)
    setAdmError('')
    try {
      const res = await fetch('/api/admissions/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...admForm, schoolSlug: 'demo-school' }),
      })
      const isJson = res.headers.get('content-type')?.includes('application/json')
      const json = isJson ? await res.json().catch(() => ({})) : {}
      if (res.ok && json.success) {
        setAdmSuccess(true)
        setAdmForm(initialAdmissionForm)
      } else {
        setAdmError(json.error || 'Submission failed. Please try again.')
      }
    } catch (err: any) {
      setAdmError(err.message || 'Error submitting application.')
    } finally {
      setAdmSubmitting(false)
    }
  }

  return {
    admForm,
    setAdmForm,
    admSubmitting,
    admSuccess,
    setAdmSuccess,
    admError,
    handleAdmissionSubmit,
  }
}
