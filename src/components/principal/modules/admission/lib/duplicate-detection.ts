/**
 * Live duplicate detection against existing students + admission applications.
 */
import type { DuplicateDetectionConfig } from '@/lib/store/school-settings-store'
import type { AdmissionFormData } from '../types'

/* ---------- Duplicate detection ---------- */
export interface DuplicateMatch {
  matchType: 'block' | 'warn' | 'none'
  score: number
  matchedField: string
  existingRecord: {
    id: string
    name: string
    className: string
    admissionNo: string
    source: 'student' | 'application'
  }
  matchedFields: string[]
}

interface DuplicateCheckable {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  className?: string
  admissionNo?: string
  dob?: string
  fatherName?: string
  motherName?: string
  fatherPhone?: string
  motherPhone?: string
  aadhaar?: string
  currentAddress?: string
  previousSchool?: string
}

/**
 * Live duplicate check against existing students + admission applications.
 * Returns the strongest match found.
 */
export function checkDuplicates(
  data: Partial<AdmissionFormData>,
  config: DuplicateDetectionConfig,
  existingStudents: DuplicateCheckable[],
  existingApplications: Array<{ id: string; applicantName: string; className: string; admissionNo: string; formData: AdmissionFormData; status: string }>
): DuplicateMatch {
  if (!config.enabled) return { matchType: 'none', score: 0, matchedField: '', existingRecord: { id: '', name: '', className: '', admissionNo: '', source: 'student' }, matchedFields: [] }

  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim().toLowerCase()
  const dob = (data.dob || '').toLowerCase()
  const aadhaar = (data.aadhaarNo || '').replace(/\s/g, '')
  const fatherName = (data.fatherName || '').toLowerCase()
  const motherName = (data.motherName || '').toLowerCase()
  const fatherPhone = (data.fatherPhone || '').replace(/\D/g, '')
  const motherPhone = (data.motherPhone || '').replace(/\D/g, '')
  const address = (data.currentAddress || '').toLowerCase()
  const previousSchool = (data.previousSchool || '').toLowerCase()

  let bestMatch: DuplicateMatch = { matchType: 'none', score: 0, matchedField: '', existingRecord: { id: '', name: '', className: '', admissionNo: '', source: 'student' }, matchedFields: [] }

  const consider = (m: DuplicateMatch) => {
    if (m.score > bestMatch.score) bestMatch = m
  }

  // Check against existing students
  for (const s of existingStudents) {
    const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).trim().toLowerCase()
    const sDob = (s.dob || '').toLowerCase()
    const sAadhaar = (s.aadhaar || '').replace(/\s/g, '')
    const sFather = (s.fatherName || '').toLowerCase()
    const sMother = (s.motherName || '').toLowerCase()
    const sFatherPhone = (s.fatherPhone || '').replace(/\D/g, '')
    const sMotherPhone = (s.motherPhone || '').replace(/\D/g, '')
    const sAddress = (s.currentAddress || '').toLowerCase()
    const sPrevSchool = (s.previousSchool || '').toLowerCase()

    // Exact Aadhaar match → 100 → block
    if (config.checkKeys.aadhaar && aadhaar && aadhaar.length >= 12 && sAadhaar && sAadhaar.replace(/\s/g, '') === aadhaar) {
      consider({
        matchType: 'block',
        score: 100,
        matchedField: 'Aadhaar',
        matchedFields: ['Aadhaar'],
        existingRecord: { id: s.id, name: s.name || `${s.firstName} ${s.lastName}`, className: s.className || '', admissionNo: s.admissionNo || '', source: 'student' },
      })
    }

    // Name + DOB match → 95 → block
    if (config.checkKeys.nameDob && fullName && sName && dob && sDob) {
      if (sName === fullName && sDob === dob) {
        consider({
          matchType: 'block',
          score: 95,
          matchedField: 'Name + DOB',
          matchedFields: ['Name', 'DOB'],
          existingRecord: { id: s.id, name: s.name || `${s.firstName} ${s.lastName}`, className: s.className || '', admissionNo: s.admissionNo || '', source: 'student' },
        })
      }
    }

    // Partial matches → warn
    const matchedFields: string[] = []
    let score = 0
    if (config.checkKeys.nameDob && fullName && sName && sName === fullName) { matchedFields.push('Name'); score += 30 }
    if (config.checkKeys.nameDob && dob && sDob && sDob === dob) { matchedFields.push('DOB'); score += 25 }
    if (config.checkKeys.parentPhone && fatherPhone && sFatherPhone && sFatherPhone === fatherPhone) { matchedFields.push('Father Phone'); score += 20 }
    if (config.checkKeys.parentPhone && motherPhone && sMotherPhone && sMotherPhone === motherPhone) { matchedFields.push('Mother Phone'); score += 15 }
    if (config.checkKeys.parents && fatherName && sFather && sFather === fatherName) { matchedFields.push('Father Name'); score += 15 }
    if (config.checkKeys.parents && motherName && sMother && sMother === motherName) { matchedFields.push('Mother Name'); score += 10 }
    if (config.checkKeys.address && address && sAddress && (sAddress.includes(address) || address.includes(sAddress)) && address.length > 10) { matchedFields.push('Address'); score += 10 }
    if (config.checkKeys.previousSchool && previousSchool && sPrevSchool && sPrevSchool === previousSchool) { matchedFields.push('Previous School'); score += 10 }

    if (score >= config.warnThreshold && score < config.blockThreshold) {
      consider({
        matchType: 'warn',
        score,
        matchedField: matchedFields[0] || 'Partial',
        matchedFields,
        existingRecord: { id: s.id, name: s.name || `${s.firstName} ${s.lastName}`, className: s.className || '', admissionNo: s.admissionNo || '', source: 'student' },
      })
    }
  }

  // Check against existing applications (excluding drafts/rejected)
  for (const a of existingApplications) {
    if (a.status === 'Rejected' || a.status === 'Archived' || a.status === 'Draft') continue
    const f = a.formData
    const aName = a.applicantName.toLowerCase()
    const aDob = (f.dob || '').toLowerCase()
    const aAadhaar = (f.aadhaarNo || '').replace(/\s/g, '')

    if (config.checkKeys.aadhaar && aadhaar && aAadhaar && aAadhaar === aadhaar) {
      consider({
        matchType: 'block',
        score: 100,
        matchedField: 'Aadhaar',
        matchedFields: ['Aadhaar'],
        existingRecord: { id: a.id, name: a.applicantName, className: a.className, admissionNo: a.admissionNo, source: 'application' },
      })
    }
    if (config.checkKeys.nameDob && fullName && aName && dob && aDob && aName === fullName && aDob === dob) {
      consider({
        matchType: 'block',
        score: 95,
        matchedField: 'Name + DOB',
        matchedFields: ['Name', 'DOB'],
        existingRecord: { id: a.id, name: a.applicantName, className: a.className, admissionNo: a.admissionNo, source: 'application' },
      })
    }
  }

  return bestMatch
}
