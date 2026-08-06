// Compliance & Audit data — accreditation, inspections, documents

export interface ComplianceItem {
  id: string
  title: string
  category: 'Accreditation' | 'Statutory' | 'Safety' | 'Academic' | 'Financial'
  authority: string
  status: 'Compliant' | 'Pending' | 'Action Required' | 'Expired'
  expiryDate: string
  lastAudit: string
  nextAudit: string
  priority: 'high' | 'medium' | 'low'
  description: string
  gradient: string
}

export const complianceItems: ComplianceItem[] = [
  { id: 'C01', title: 'CBSE Affiliation Renewal', category: 'Accreditation', authority: 'CBSE Board', status: 'Compliant', expiryDate: '2027-03-31', lastAudit: '2024-03-15', nextAudit: '2027-01-15', priority: 'high', description: 'Affiliation No. 1730456 — valid till March 2027. All conditions met.', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'C02', title: 'Fire Safety Certificate', category: 'Safety', authority: 'State Fire Department', status: 'Compliant', expiryDate: '2025-06-30', lastAudit: '2024-06-10', nextAudit: '2025-05-10', priority: 'high', description: 'Annual fire safety inspection passed. 12 extinguishers, 4 alarms, 2 hydrants checked.', gradient: 'from-rose-500 to-pink-600' },
  { id: 'C03', title: 'Building Safety Certificate', category: 'Safety', authority: 'Municipal Corporation', status: 'Compliant', expiryDate: '2026-12-31', lastAudit: '2024-01-20', nextAudit: '2026-11-20', priority: 'medium', description: 'Structural integrity verified. All exits compliant.', gradient: 'from-amber-500 to-orange-600' },
  { id: 'C04', title: 'GST Registration', category: 'Statutory', authority: 'GST Council', status: 'Compliant', expiryDate: '—', lastAudit: '2024-11-30', nextAudit: 'Monthly', priority: 'medium', description: 'GSTIN: 06AABCG1234L1Z5. Monthly returns filed on time.', gradient: 'from-violet-500 to-purple-600' },
  { id: 'C05', title: 'Health & Sanitation License', category: 'Safety', authority: 'Health Department', status: 'Pending', expiryDate: '2025-03-31', lastAudit: '2024-09-15', nextAudit: '2025-02-15', priority: 'high', description: 'Annual inspection scheduled. Mess kitchen needs deep cleaning before audit.', gradient: 'from-cyan-500 to-sky-600' },
  { id: 'C06', title: 'Staff PF & ESI Compliance', category: 'Statutory', authority: 'EPFO & ESIC', status: 'Compliant', expiryDate: '—', lastAudit: '2024-11-30', nextAudit: 'Monthly', priority: 'high', description: 'PF: ₹8.6L contributed · ESI: ₹2.4L. All 124 employees covered.', gradient: 'from-indigo-500 to-blue-600' },
  { id: 'C07', title: 'Transport Vehicle Permits', category: 'Statutory', authority: 'RTO Gurugram', status: 'Action Required', expiryDate: '2025-01-15', lastAudit: '2024-06-20', nextAudit: '2025-01-10', priority: 'high', description: '2 vehicle permits expiring in January. Renewal applications in progress.', gradient: 'from-lime-500 to-green-600' },
  { id: 'C08', title: 'Annual Academic Audit', category: 'Academic', authority: 'CBSE Board', status: 'Pending', expiryDate: '—', lastAudit: '2024-04-10', nextAudit: '2025-04-10', priority: 'medium', description: 'Annual academic audit by CBSE observer. Documentation being prepared.', gradient: 'from-fuchsia-500 to-pink-600' },
  { id: 'C09', title: 'ISO 9001:2015 Certification', category: 'Accreditation', authority: 'ISO Certifying Body', status: 'Compliant', expiryDate: '2026-08-31', lastAudit: '2024-08-15', nextAudit: '2025-08-15', priority: 'low', description: 'Quality Management System recertified. Surveillance audit passed.', gradient: 'from-teal-500 to-cyan-600' },
  { id: 'C10', title: 'Child Protection Policy', category: 'Safety', authority: 'POCSO Compliance', status: 'Compliant', expiryDate: '—', lastAudit: '2024-07-20', nextAudit: 'Annual', priority: 'high', description: 'POCSO committee constituted. All staff trained. Background verification done.', gradient: 'from-orange-500 to-red-600' },
]

export interface AuditLog {
  id: string
  date: string
  type: 'Internal' | 'External' | 'Statutory'
  auditor: string
  area: string
  findings: number
  status: 'Completed' | 'In Progress' | 'Scheduled'
  rating: number
  notes?: string
}

export const auditLogs: AuditLog[] = [
  { id: 'AL01', date: '2024-11-30', type: 'Statutory', auditor: 'EPFO Inspector', area: 'Staff PF/ESI', findings: 0, status: 'Completed', rating: 5, notes: 'Perfect compliance. No findings.' },
  { id: 'AL02', date: '2024-11-15', type: 'Internal', auditor: 'Admin Office', area: 'Fee Collection', findings: 2, status: 'Completed', rating: 4, notes: '2 minor discrepancies in receipt numbering. Corrected.' },
  { id: 'AL03', date: '2024-10-20', type: 'External', auditor: 'CBSE Observer', area: 'Academic Records', findings: 1, status: 'Completed', rating: 4, notes: 'Lesson plan documentation needs standardization.' },
  { id: 'AL04', date: '2024-09-15', type: 'Statutory', auditor: 'Health Officer', area: 'Sanitation', findings: 3, status: 'In Progress', rating: 3, notes: 'Mess kitchen deep cleaning + 2 washroom repairs pending.' },
  { id: 'AL05', date: '2024-12-10', type: 'External', auditor: 'Fire Safety Officer', area: 'Fire Safety', findings: 0, status: 'Scheduled', rating: 0 },
]

export interface ComplianceDocument {
  id: string
  name: string
  category: string
  type: string
  size: string
  uploadedOn: string
  uploadedBy: string
  status: 'Verified' | 'Pending' | 'Expiring Soon'
  version: string
}

export const complianceDocuments: ComplianceDocument[] = [
  { id: 'D01', name: 'CBSE Affiliation Certificate', category: 'Accreditation', type: 'PDF', size: '2.4 MB', uploadedOn: '2024-03-20', uploadedBy: 'Dr. Ananya Iyer', status: 'Verified', version: 'v3.0' },
  { id: 'D02', name: 'Fire Safety Report 2024', category: 'Safety', type: 'PDF', size: '1.8 MB', uploadedOn: '2024-06-12', uploadedBy: 'Admin Office', status: 'Verified', version: 'v1.0' },
  { id: 'D03', name: 'GST Returns — Nov 2024', category: 'Statutory', type: 'PDF', size: '840 KB', uploadedOn: '2024-11-30', uploadedBy: 'Accounts', status: 'Verified', version: 'v11.0' },
  { id: 'D04', name: 'Staff PF Statement Q3', category: 'Statutory', type: 'XLSX', size: '320 KB', uploadedOn: '2024-10-15', uploadedBy: 'HR Department', status: 'Verified', version: 'v3.0' },
  { id: 'D05', name: 'Transport Permit — Vehicle HR-26-IJ', category: 'Statutory', type: 'PDF', size: '620 KB', uploadedOn: '2024-06-20', uploadedBy: 'Transport', status: 'Expiring Soon', version: 'v1.0' },
  { id: 'D06', name: 'POCSO Committee Report', category: 'Safety', type: 'PDF', size: '1.2 MB', uploadedOn: '2024-07-25', uploadedBy: 'Dr. Ananya Iyer', status: 'Verified', version: 'v2.0' },
  { id: 'D07', name: 'ISO 9001 Surveillance Report', category: 'Accreditation', type: 'PDF', size: '3.6 MB', uploadedOn: '2024-08-18', uploadedBy: 'Quality Cell', status: 'Verified', version: 'v1.0' },
  { id: 'D08', name: 'Annual Academic Audit 2024', category: 'Academic', type: 'PDF', size: '4.2 MB', uploadedOn: '2024-04-15', uploadedBy: 'Academic Office', status: 'Pending', version: 'v1.0' },
]

export const complianceStats = {
  totalItems: 10,
  compliant: 7,
  pending: 2,
  actionRequired: 1,
  complianceScore: 92,
  totalDocuments: 48,
  verifiedDocs: 42,
  expiringSoon: 3,
  upcomingAudits: 2,
  auditsThisYear: 8,
  avgRating: 4.2,
  complianceTrend: [
    { month: 'Jul', score: 88 }, { month: 'Aug', score: 90 },
    { month: 'Sep', score: 89 }, { month: 'Oct', score: 91 },
    { month: 'Nov', score: 92 },
  ],
  categoryBreakdown: [
    { name: 'Accreditation', value: 2, color: 'oklch(0.55 0.14 162)' },
    { name: 'Statutory', value: 3, color: 'oklch(0.65 0.16 75)' },
    { name: 'Safety', value: 3, color: 'oklch(0.62 0.2 25)' },
    { name: 'Academic', value: 1, color: 'oklch(0.6 0.18 300)' },
    { name: 'Financial', value: 1, color: 'oklch(0.7 0.15 200)' },
  ],
}
