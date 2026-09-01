'use client'

/**
 * useAdmissionWizard — central state + handlers for the admission form wizard.
 *
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 * Holds wizard step state, the visible-steps computation, the field setter
 * (with permanent-address auto-sync), step navigation, post-submit duplicate
 * detection flow, and the auto-save-draft side effect.
 */
import { useState, useMemo, useRef, useEffect } from 'react'
import { students } from '@/lib/mock/students'
import { toast } from 'sonner'
import { useAdmissionStore } from '@/lib/store/admission-store'
import {
  useAdmissionFeatureFlags,
  useDuplicateDetectionConfig,
  checkDuplicates,
  type DuplicateMatch,
} from './admission-utils'
import {
  STEPS,
  createBlankData,
  initialData,
  type FormData,
} from '../constants'
import type { FeeDataState } from '../../FeeStructureStep'

export function useAdmissionWizard() {
  const admissionStore = useAdmissionStore()
  const flags = useAdmissionFeatureFlags()
  const dupConfig = useDuplicateDetectionConfig()

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>(initialData)

  // Stepper auto-scroll ref — effect wired after currentVisibleIndex is computed
  const stepperScrollRef = useRef<HTMLDivElement>(null)

  // Compute visible steps — auto-skip Previous School for pre-primary classes
  const visibleSteps = useMemo(() => {
    return STEPS.filter((s) => {
      // Personal (1), Parents (2), Address (3), Applying For (4) — always
      if (s.id <= 4) return true
      // Previous School (5) — auto-skip for Nursery/LKG/UKG/Class 1
      if (s.id === 5) {
        const cls = (data.className || '').toLowerCase()
        const skipClasses = flags.previousSchoolSkipClasses.map((c) => c.toLowerCase())
        const isPrePrimary = skipClasses.some((sc) => cls.includes(sc))
        if (isPrePrimary) return false
        return flags.enablePreviousSchool
      }
      // Transport (6) — conditional on transport/hostel facility
      if (s.id === 6) return flags.enableTransport || flags.enableHostel
      // Fee (7), Review (10) — always
      if (s.id === 7 || s.id === 10) return true
      // Photo (8) — conditional on enableStudentPhoto
      if (s.id === 8) return flags.enableStudentPhoto
      // Documents (9) — always
      if (s.id === 9) return true
      return true
    })
  }, [data.className, flags])

  // Map visible steps to a sequential index for the stepper UI
  const stepIndex = visibleSteps.findIndex((s) => s.id === step)
  const currentVisibleIndex = stepIndex === -1 ? 0 : stepIndex

  // Stepper auto-scroll: keep current step centered in the horizontal nav
  useEffect(() => {
    const container = stepperScrollRef.current
    if (!container) return
    const currentBtn = container.querySelector(`[data-step-idx="${currentVisibleIndex}"]`) as HTMLElement | null
    if (currentBtn) {
      const scrollLeft = currentBtn.offsetLeft - container.offsetWidth / 2 + currentBtn.offsetWidth / 2
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
    }
  }, [currentVisibleIndex, step])

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => {
      const nextData = { ...prev, [key]: value }

      // Auto-synchronize Permanent Address when sameAsCurrentAddress is enabled
      if (nextData.sameAsCurrentAddress) {
        if (key === 'currentAddress') nextData.permAddress = value as string
        if (key === 'country') nextData.permCountry = value as string
        if (key === 'state') nextData.permState = value as string
        if (key === 'district') nextData.permDistrict = value as string
        if (key === 'city') nextData.permCity = value as string
        if (key === 'pincode') nextData.permPincode = value as string
      }

      return nextData
    })
  }

  const handleToggleSameAddress = (checked: boolean) => {
    setData((prev) => {
      if (checked) {
        return {
          ...prev,
          sameAsCurrentAddress: true,
          permAddress: prev.currentAddress,
          permCountry: prev.country,
          permState: prev.state,
          permDistrict: prev.district,
          permCity: prev.city,
          permPincode: prev.pincode,
        }
      }
      return { ...prev, sameAsCurrentAddress: false }
    })
  }

  // Navigate through visible steps only (skips conditional steps automatically)
  const next = () => {
    const curIdx = visibleSteps.findIndex((s) => s.id === step)
    if (curIdx < visibleSteps.length - 1) {
      setStep(visibleSteps[curIdx + 1].id)
    }
  }
  const back = () => {
    const curIdx = visibleSteps.findIndex((s) => s.id === step)
    if (curIdx > 0) {
      setStep(visibleSteps[curIdx - 1].id)
    }
  }

  // Duplicate detection runs ONLY on final submit (not while filling)
  const [postSubmitDup, setPostSubmitDup] = useState<DuplicateMatch | null>(null)
  const [pendingSubmitData, setPendingSubmitData] = useState<{ formData: Partial<FormData>; feeState: Partial<FeeDataState> } | null>(null)

  const finalizeSubmission = (formDataPartial: Partial<FormData>, feeDataPartial: Partial<FeeDataState>) => {
    const newAppId = `APP-${Date.now().toString().slice(-6)}`
    const appId = admissionStore.createOrUpdateDraft(formDataPartial, feeDataPartial, newAppId)
    admissionStore.submitApplication(appId)

    toast.success('Application submitted', {
      description: `${data.firstName} ${data.lastName}'s application is now in the review queue.`,
    })

    setPostSubmitDup(null)
    setPendingSubmitData(null)
    setData(createBlankData())
    setStep(1)
    setViewMode('list')
  }

  const handleSubmit = () => {
    const formDataPartial: Partial<FormData> = { ...data }
    const feeDataPartial: Partial<FeeDataState> = data.feeState || {}

    // Check duplicates only at submit time
    if (dupConfig.enabled) {
      const match = checkDuplicates(data, dupConfig, students as any, admissionStore.applications || [])
      if (match && match.matchType !== 'none') {
        setPostSubmitDup(match)
        setPendingSubmitData({ formData: formDataPartial, feeState: feeDataPartial })
        return
      }
    }
    finalizeSubmission(formDataPartial, feeDataPartial)
  }

  const handleContinueAnyway = () => {
    if (pendingSubmitData) {
      toast.success('Principal override logged', { description: 'Submission proceeding despite duplicate warning.' })
      finalizeSubmission(pendingSubmitData.formData, pendingSubmitData.feeState)
    }
  }

  const handleCancelSubmission = () => {
    setPostSubmitDup(null)
    setPendingSubmitData(null)
    toast.info('Submission cancelled')
  }

  // Auto-save draft on browser close / tab switch — no Save Draft button needed.
  // If the principal exits midway, the application is silently saved as a Draft
  // and can be resumed later. Drafts do NOT appear in Pending Review.
  const draftIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (viewMode !== 'form') return
    // Only auto-save if the user has entered at least a name
    if (!data.firstName && !data.lastName) return

    const saveDraft = () => {
      if (!data.firstName && !data.lastName) return
      const id = draftIdRef.current || `DRAFT-${Date.now().toString().slice(-6)}`
      draftIdRef.current = id
      admissionStore.createOrUpdateDraft({ ...data }, data.feeState || {}, id)
    }

    const handler = () => saveDraft()
    window.addEventListener('beforeunload', handler)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveDraft()
    })
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [viewMode, data, admissionStore])

  return {
    flags,
    viewMode,
    setViewMode,
    step,
    setStep,
    data,
    setData,
    set,
    handleToggleSameAddress,
    next,
    back,
    visibleSteps,
    currentVisibleIndex,
    stepperScrollRef,
    postSubmitDup,
    handleSubmit,
    handleContinueAnyway,
    handleCancelSubmission,
    admissionStore,
  }
}
