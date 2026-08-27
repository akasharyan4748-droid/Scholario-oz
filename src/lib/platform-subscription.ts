// Scholario SaaS Platform Subscription Engine
// Completely independent from School Fees. Handles student platform licensing.

export interface PlatformConfig {
  annualFee: number
  offerDiscountPercentage: number
  payableAmount: number
  upiId: string
  merchantName: string
  currency: string
  supportEmail: string
  supportPhone: string
}

export interface StudentSubscriptionRecord {
  studentId: string
  studentName: string
  schoolName: string
  isActive: boolean
  planName: string
  amountPaid: number
  activatedAt?: string
  expiresAt?: string
  paymentMethod?: string
  transactionRef?: string
  receiptNo?: string
}

// Global Platform Subscription Settings (Configurable by SuperAdmin)
let globalPlatformConfig: PlatformConfig = {
  annualFee: 600,
  offerDiscountPercentage: 50,
  payableAmount: 300,
  upiId: 'scholario.platform@icici',
  merchantName: 'Scholario Education Technologies Pvt Ltd',
  currency: 'INR',
  supportEmail: 'subscriptions@scholario.app',
  supportPhone: '+91 1800 200 4500',
}

// In-memory subscription database
const subscriptionStore: Record<string, StudentSubscriptionRecord> = {
  'STU-2024-018': {
    studentId: 'STU-2024-018',
    studentName: 'Aarav Sharma',
    schoolName: 'Demo School of Scholario',
    isActive: true,
    planName: 'Scholario Annual Student Platform License',
    amountPaid: 300,
    activatedAt: '2025-04-01',
    expiresAt: '2026-04-01',
    paymentMethod: 'UPI QR Code',
    transactionRef: 'UPI/504912903481/OKICICI',
    receiptNo: 'SCH-SUB-2025-018',
  },
}

export const getPlatformConfig = (): PlatformConfig => globalPlatformConfig

export const updatePlatformConfig = (newConfig: Partial<PlatformConfig>): PlatformConfig => {
  globalPlatformConfig = { ...globalPlatformConfig, ...newConfig }
  // Recalculate payable amount if discount changes
  if (newConfig.annualFee !== undefined || newConfig.offerDiscountPercentage !== undefined) {
    const fee = globalPlatformConfig.annualFee
    const disc = globalPlatformConfig.offerDiscountPercentage
    globalPlatformConfig.payableAmount = Math.round(fee - (fee * disc) / 100)
  }
  return globalPlatformConfig
}

export const getStudentSubscription = (studentId: string): StudentSubscriptionRecord => {
  if (subscriptionStore[studentId]) {
    return subscriptionStore[studentId]
  }

  // Default record for new/unsubbed student
  return {
    studentId,
    studentName: 'New Enrolled Student',
    schoolName: 'Demo School of Scholario',
    isActive: false, // Default inactive to trigger activation workflow
    planName: 'Scholario Annual Student Platform License',
    amountPaid: globalPlatformConfig.payableAmount,
  }
}

export const activateStudentSubscription = (
  studentId: string,
  studentName: string,
  paymentMethod: string,
  transactionRef: string
): StudentSubscriptionRecord => {
  const now = new Date()
  const expiry = new Date()
  expiry.setFullYear(now.getFullYear() + 1)

  const record: StudentSubscriptionRecord = {
    studentId,
    studentName,
    schoolName: 'Demo School of Scholario',
    isActive: true,
    planName: 'Scholario Annual Student Platform License',
    amountPaid: globalPlatformConfig.payableAmount,
    activatedAt: now.toISOString().split('T')[0],
    expiresAt: expiry.toISOString().split('T')[0],
    paymentMethod,
    transactionRef: transactionRef || `UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}/PAY`,
    receiptNo: `SCH-SUB-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  }

  subscriptionStore[studentId] = record
  return record
}
