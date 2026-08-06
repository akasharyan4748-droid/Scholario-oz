// Formatting helpers
export const formatINR = (amount: number, compact = false): string => {
  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('en-IN').format(n)

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export const initials = (name: string): string =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

// Grade color
export const gradeColor = (grade: string): string => {
  if (grade.startsWith('A+')) return 'oklch(0.55 0.14 162)'
  if (grade.startsWith('A')) return 'oklch(0.65 0.16 75)'
  if (grade.startsWith('B')) return 'oklch(0.7 0.15 200)'
  if (grade.startsWith('C')) return 'oklch(0.62 0.2 25)'
  return 'oklch(0.5 0.02 160)'
}

// Avatar gradient from string
export const avatarGradient = (seed: string): string => {
  const gradients = [
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500',
    'from-violet-400 to-purple-500',
    'from-cyan-400 to-sky-500',
    'from-lime-400 to-green-500',
    'from-fuchsia-400 to-pink-500',
    'from-orange-400 to-red-500',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return gradients[Math.abs(hash) % gradients.length]
}

export type FormatType =
  | 'aadhaar'
  | 'phone'
  | 'mobile'
  | 'bankAccount'
  | 'bank'
  | 'ifsc'
  | 'employeeId'
  | 'employee'
  | 'admissionNo'
  | 'admission'
  | 'digits'

export function cleanDigits(val: string): string {
  return val.replace(/\D/g, '')
}

export function cleanAlphanumeric(val: string): string {
  return val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

export function formatAadhaarDisplay(val: string): string {
  const digits = cleanDigits(val).slice(0, 12)
  if (!digits) return ''
  const parts: string[] = []
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4))
  }
  return parts.join(' ')
}

export function formatMobileDisplay(val: string): string {
  const digits = cleanDigits(val).slice(0, 10)
  if (!digits) return ''
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)} ${digits.slice(5)}`
}

export function formatBankAccountDisplay(val: string): string {
  const digits = cleanDigits(val).slice(0, 18)
  if (!digits) return ''
  const parts: string[] = []
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4))
  }
  return parts.join(' ')
}

export function formatIFSCDisplay(val: string): string {
  return cleanAlphanumeric(val).slice(0, 11)
}

export function formatEmployeeIdDisplay(val: string): string {
  return cleanAlphanumeric(val).slice(0, 12)
}

export function formatAdmissionNoDisplay(val: string): string {
  return cleanAlphanumeric(val).slice(0, 15)
}

export function getFormattedValue(val: string, formatType?: FormatType): string {
  if (!val) return ''
  switch (formatType) {
    case 'aadhaar':
      return formatAadhaarDisplay(val)
    case 'phone':
    case 'mobile':
      return formatMobileDisplay(val)
    case 'bankAccount':
    case 'bank':
      return formatBankAccountDisplay(val)
    case 'ifsc':
      return formatIFSCDisplay(val)
    case 'employeeId':
    case 'employee':
      return formatEmployeeIdDisplay(val)
    case 'admissionNo':
    case 'admission':
      return formatAdmissionNoDisplay(val)
    case 'digits':
      return cleanDigits(val)
    default:
      return val
  }
}

export function getCleanRawValue(val: string, formatType?: FormatType): string {
  if (!val) return ''
  switch (formatType) {
    case 'aadhaar':
    case 'phone':
    case 'mobile':
    case 'bankAccount':
    case 'bank':
    case 'digits':
      return cleanDigits(val)
    case 'ifsc':
    case 'employeeId':
    case 'employee':
    case 'admissionNo':
    case 'admission':
      return cleanAlphanumeric(val)
    default:
      return val
  }
}

