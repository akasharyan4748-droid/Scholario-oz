/**
 * Global search across admission records.
 */
import type { AdmissionFormData } from '../types'

/* ---------- Global search across admission records ---------- */
export function searchAdmissions(
  applications: Array<{ id: string; applicantName: string; admissionNo: string; className: string; formData: AdmissionFormData }>,
  query: string
) {
  const q = query.trim().toLowerCase()
  if (!q) return applications
  return applications.filter((a) => {
    const f = a.formData
    return (
      a.applicantName.toLowerCase().includes(q) ||
      a.admissionNo.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      (f.aadhaarNo || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
      (f.fatherName || '').toLowerCase().includes(q) ||
      (f.motherName || '').toLowerCase().includes(q) ||
      (f.fatherPhone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      (f.motherPhone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      (f.previousSchool || '').toLowerCase().includes(q)
    )
  })
}
