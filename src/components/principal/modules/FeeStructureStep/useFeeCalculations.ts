import { useMemo } from 'react'
import { toast } from 'sonner'
import { getSchoolSettings } from '@/lib/school-settings'
import { feeStructures } from '@/lib/mock/finance'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { ACTIVITY_KIT_ITEMS, HOSTEL_COST, INITIAL_INSTALLMENT_RATIO, SCHOLARSHIP_PERCENT, TRANSPORT_COST } from './constants'
import type { FeeDataState, SelectionCategory } from './types'

/** Resolves the class-specific fee structure (read-only, source: Fee Management). */
function resolveFeeStructure(className: string) {
  const cls = className.toLowerCase()
  if (cls.includes('nursery') || cls.includes('lkg') || cls.includes('ukg')) {
    return feeStructures.find((f) => f.category === 'Pre-Primary') || feeStructures[0]
  }
  if (cls.includes('1') || cls.includes('2') || cls.includes('3') || cls.includes('4') || cls.includes('5')) {
    return feeStructures.find((f) => f.category === 'Primary') || feeStructures[0]
  }
  if (cls.includes('6') || cls.includes('7') || cls.includes('8')) {
    return feeStructures.find((f) => f.category === 'Middle') || feeStructures[0]
  }
  if (cls.includes('9') || cls.includes('10')) {
    return feeStructures.find((f) => f.category === 'Secondary') || feeStructures[0]
  }
  if (cls.includes('11') || cls.includes('12')) {
    return feeStructures.find((f) => f.category === 'Senior') || feeStructures[0]
  }
  return feeStructures[0]
}

/** Looks up class-specific books from Books Master (or auto-generates a fallback). */
function resolveClassBooks(className: string, booksMaster: ReturnType<typeof getSchoolSettings>['booksMaster']) {
  const existing = booksMaster.filter((b) => {
    const cls = b.className.toLowerCase().trim()
    const targetCls = className.toLowerCase().trim()
    return cls === targetCls || targetCls.includes(cls) || cls.includes(targetCls)
  })
  if (existing.length > 0) return existing.map((b) => ({ ...b, isMandatory: false }))

  const clsName = className || 'Class 1'
  return [
    { id: `BK-ENG-${clsName}`, title: `${clsName} English Literature`, publisher: 'NCERT', price: 180, category: 'Textbook', isMandatory: false, className: clsName },
    { id: `BK-MATH-${clsName}`, title: `${clsName} Mathematics`, publisher: 'NCERT', price: 220, category: 'Textbook', isMandatory: false, className: clsName },
    { id: `BK-SCI-${clsName}`, title: `${clsName} Science & EVS`, publisher: 'NCERT', price: 240, category: 'Textbook', isMandatory: false, className: clsName },
    { id: `BK-HIN-${clsName}`, title: `${clsName} Hindi Rimjhim`, publisher: 'NCERT', price: 150, category: 'Textbook', isMandatory: false, className: clsName },
    { id: `BK-SST-${clsName}`, title: `${clsName} Social Studies`, publisher: 'Oxford', price: 280, category: 'Reference', isMandatory: false, className: clsName },
    { id: `BK-COMP-${clsName}`, title: `${clsName} Computer Workbook`, publisher: 'Evergreen', price: 260, category: 'Workbook', isMandatory: false, className: clsName },
  ]
}

export interface FeeCalculations {
  feeStructure: ReturnType<typeof resolveFeeStructure>
  classBooks: ReturnType<typeof resolveClassBooks>
  uniforms: ReturnType<typeof useSchoolSettingsStore.getState>['uniforms']
  examConfig: ReturnType<typeof getSchoolSettings>['examFeeConfig']
  examTotal: number
  booksTotal: number
  booksCount: number
  uniformTotal: number
  uniformCount: number
  activityKitTotal: number
  activityKitCount: number
  transportCost: number
  hostelCost: number
  transportTotal: number
  hostelTotal: number
  registrationFee: number
  admissionFee: number
  tuitionFee: number
  otherHeadsTotal: number
  optionalTotal: number
  grossFee: number
  selectedDiscount: ReturnType<typeof getSchoolSettings>['discountRules'][number] | undefined
  discountAmount: number
  scholarshipAmount: number
  waiverAmount: number
  totalDiscount: number
  netTotal: number
  initialInstallment: number
  remainingBalance: number
}

/**
 * Encapsulates the entire fee-derivation pipeline used by {@link FeeStructureStep}.
 * Computes class-aware book lists, exam totals, discounts, scholarships, waivers,
 * and the final installment split — all reactive to `feeState` and `className`.
 */
export function useFeeCalculations(
  className: string,
  feeState: FeeDataState,
  onChangeFeeState: (next: FeeDataState) => void,
  flags?: { enableTransport?: boolean; enableHostel?: boolean },
): FeeCalculations & {
  schoolSettings: ReturnType<typeof getSchoolSettings>
  settingsStore: ReturnType<typeof useSchoolSettingsStore>
  updateSelection: (cat: SelectionCategory, itemId: string, qty: number) => void
  toggleSelection: (cat: SelectionCategory, itemId: string) => void
  handleApplyWaiver: () => void
} {
  const schoolSettings = getSchoolSettings()
  const settingsStore = useSchoolSettingsStore()
  const uniforms = settingsStore.uniforms

  const feeStructure = useMemo(() => resolveFeeStructure(className), [className])
  const classBooks = useMemo(() => resolveClassBooks(className, schoolSettings.booksMaster), [className, schoolSettings.booksMaster])

  /* ---------- Selection helpers ---------- */
  const updateSelection = (category: SelectionCategory, itemId: string, qty: number) => {
    const current = { ...feeState[category] }
    if (qty <= 0) {
      delete current[itemId]
    } else {
      current[itemId] = qty
    }
    onChangeFeeState({ ...feeState, [category]: current })
  }

  const toggleSelection = (category: SelectionCategory, itemId: string) => {
    const current = { ...feeState[category] }
    if (current[itemId]) {
      delete current[itemId]
    } else {
      current[itemId] = 1
    }
    onChangeFeeState({ ...feeState, [category]: current })
  }

  /* ---------- Calculations (real-time) ---------- */
  const examConfig = schoolSettings.examFeeConfig
  const examTotal =
    (feeState.examGroups.unitTest ? examConfig.unitTestFee : 0) +
    (feeState.examGroups.termExam ? examConfig.termExamFee : 0) +
    (feeState.examGroups.customGroups ? examConfig.customGroupsFee : 0)

  const booksTotal = classBooks.reduce((sum, b) => sum + (feeState.bookSelections[b.id] || 0) * b.price, 0)
  const booksCount = Object.values(feeState.bookSelections).reduce((a, b) => a + b, 0)

  const uniformTotal = uniforms.reduce((sum, u) => sum + (feeState.uniformSelections[u.id] || 0) * u.price, 0)
  const uniformCount = Object.values(feeState.uniformSelections).reduce((a, b) => a + b, 0)

  const activityKitTotal = ACTIVITY_KIT_ITEMS.reduce((sum, a) => sum + (feeState.activityKitSelections[a.id] || 0) * a.price, 0)
  const activityKitCount = Object.values(feeState.activityKitSelections).reduce((a, b) => a + b, 0)

  const transportCost = TRANSPORT_COST
  const hostelCost = HOSTEL_COST
  const transportTotal = feeState.transportSelected && flags?.enableTransport ? transportCost : 0
  const hostelTotal = feeState.hostelSelected && flags?.enableHostel ? hostelCost : 0

  // Institutional fee heads (read-only)
  const baseFeeHeads = schoolSettings.feeHeads
  const registrationFee = baseFeeHeads.find((f) => f.category === 'Registration')?.defaultAmount || 1500
  const admissionFee = baseFeeHeads.find((f) => f.category === 'Admission')?.defaultAmount || 15000
  const tuitionFee = baseFeeHeads.find((f) => f.category === 'Tuition')?.defaultAmount || 60000
  const otherHeadsTotal = baseFeeHeads
    .filter((f) => !['Registration', 'Admission', 'Tuition'].includes(f.category))
    .reduce((a, b) => a + b.defaultAmount, 0)

  const optionalTotal = booksTotal + uniformTotal + activityKitTotal + transportTotal + hostelTotal
  const grossFee = registrationFee + admissionFee + tuitionFee + otherHeadsTotal + examTotal + optionalTotal

  // Discount calculation
  const selectedDiscount = schoolSettings.discountRules.find((d) => d.code === feeState.discountCode)
  let discountAmount = 0
  if (selectedDiscount) {
    discountAmount = selectedDiscount.type === 'percentage'
      ? Math.round((grossFee * selectedDiscount.value) / 100)
      : selectedDiscount.value
  } else if (feeState.discountCode === 'CUSTOM') {
    discountAmount = Number(feeState.customDiscountValue) || 0
  }

  const scholarshipAmount = feeState.discountCode === 'SCHOLAR' ? Math.round((grossFee * SCHOLARSHIP_PERCENT) / 100) : 0
  const waiverAmount = discountAmount
  const totalDiscount = scholarshipAmount + waiverAmount
  const netTotal = Math.max(0, grossFee - totalDiscount)
  const initialInstallment = Math.round(netTotal * INITIAL_INSTALLMENT_RATIO)
  const remainingBalance = netTotal - initialInstallment

  const handleApplyWaiver = () => {
    if (!feeState.waiverAppliedBy || !feeState.waiverApprovalAuthority) {
      toast.error('Fill Applied By and Approval Authority')
      return
    }
    settingsStore.addWaiverAudit({
      appliedBy: feeState.waiverAppliedBy,
      appliedByRole: 'Principal',
      approvalAuthority: feeState.waiverApprovalAuthority,
      approvalDate: new Date().toISOString().split('T')[0],
      reason: feeState.waiverReason || 'Discretionary waiver',
      amount: waiverAmount,
    })
    toast.success('Waiver applied & logged in audit trail')
  }

  return {
    schoolSettings,
    settingsStore,
    feeStructure,
    classBooks,
    uniforms,
    examConfig,
    examTotal,
    booksTotal,
    booksCount,
    uniformTotal,
    uniformCount,
    activityKitTotal,
    activityKitCount,
    transportCost,
    hostelCost,
    transportTotal,
    hostelTotal,
    registrationFee,
    admissionFee,
    tuitionFee,
    otherHeadsTotal,
    optionalTotal,
    grossFee,
    selectedDiscount,
    discountAmount,
    scholarshipAmount,
    waiverAmount,
    totalDiscount,
    netTotal,
    initialInstallment,
    remainingBalance,
    updateSelection,
    toggleSelection,
    handleApplyWaiver,
  }
}
