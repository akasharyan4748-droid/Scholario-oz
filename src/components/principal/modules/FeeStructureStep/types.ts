import type { AdmissionFeatureFlags } from '@/lib/store/school-settings-store'

/* ============================================================
   FeeDataState — shopping-cart style selection with quantities
   ============================================================ */
export interface FeeDataState {
  // Individual item selections: itemId → quantity (1+). Absent = not selected.
  bookSelections: Record<string, number>
  uniformSelections: Record<string, number>
  activityKitSelections: Record<string, number>
  // Exam group toggles
  examGroups: { unitTest: boolean; termExam: boolean; customGroups: boolean }
  // Flat-fee optional services (transport, hostel)
  transportSelected: boolean
  hostelSelected: boolean
  // Concession
  discountCode: string
  customDiscountValue: number
  customDiscountReason: string
  // Waiver audit
  waiverAppliedBy?: string
  waiverApprovalAuthority?: string
  waiverReason?: string
  // Issuance/verification summary fields (used by FeeReceiptTab + SectionDataContent)
  // These are populated at issuance time and persisted on the application record.
  paymentMethod?: string
  selectedFeeHeadIds?: string[]
}

export const defaultFeeDataState: FeeDataState = {
  bookSelections: {},
  uniformSelections: {},
  activityKitSelections: {},
  examGroups: { unitTest: false, termExam: false, customGroups: false },
  transportSelected: false,
  hostelSelected: false,
  discountCode: 'NONE',
  customDiscountValue: 0,
  customDiscountReason: '',
}

export interface FeeStructureStepProps {
  className: string
  feeState: FeeDataState
  onChangeFeeState: (newState: FeeDataState) => void
  flags?: AdmissionFeatureFlags
}

/** Selection-category keys used for shopping-cart style item maps. */
export type SelectionCategory = 'bookSelections' | 'uniformSelections' | 'activityKitSelections'

/** Cart-row props shared by the Books, Uniform and Activity Kit lists. */
export interface CartRowProps {
  title: string
  subtitle: string
  price: number
  qty: number
  selected: boolean
  onToggle: () => void
  onQtyChange: (qty: number) => void
}
