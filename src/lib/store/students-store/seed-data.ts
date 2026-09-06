import type { ClassRecord, FeeStatus, Gender, StudentRecord } from './types'
import { CLASS_DEFS, HOUSE_DEFS, SUBJECTS_BY_LEVEL, SEED_SUBJECTS } from './constants'
import { streamKeyFromDbValue, type StreamKey } from '@/lib/mock/academic'

// ============================================================
// SEED DATA — Compact, generated lazily
// ============================================================

const FIRST: string[] = ['Aarav', 'Diya', 'Vivaan', 'Ananya', 'Reyansh', 'Saanvi', 'Arjun', 'Myra', 'Kabir', 'Kiara', 'Vihaan', 'Anika', 'Dhruv', 'Aadhya', 'Sai', 'Pari', 'Rohan', 'Riya', 'Karan', 'Nisha']
const LAST: string[] = ['Sharma', 'Patel', 'Reddy', 'Singh', 'Kumar', 'Verma', 'Nair', 'Gupta', 'Mehta', 'Iyer', 'Khanna', 'Rao', 'Agarwal', 'Desai', 'Joshi']
const DADS: string[] = ['Rahul Sharma', 'Nikhil Patel', 'Karthik Reddy', 'Arvind Singh', 'Sandeep Kumar', 'Manish Verma', 'Vinod Nair', 'Rajesh Gupta', 'Tarun Mehta', 'Sriram Iyer']
const MOMS: string[] = ['Pooja Sharma', 'Sneha Patel', 'Lakshmi Reddy', 'Meera Singh', 'Ritu Kumar', 'Kavita Verma', 'Deepa Nair', 'Anjali Gupta', 'Shweta Mehta', 'Geeta Iyer']
const ADDR: string[] = ['A-12, Sector 14, Gurugram', 'B-45, DLF Phase 3, Gurugram', 'C-23, Sushant Lok, Gurugram', 'D-67, Palam Vihar, Gurugram', 'E-89, Sector 56, Gurugram']
const MED: string[] = ['No known allergies', 'Asthma — carries inhaler', 'Peanut allergy', 'Lactose intolerant', 'Dust allergy']

/**
 * FEE-POLICY 2025-26 — annual BASE payable mirrored from the canonical fee
 * structures (src/lib/store/fee-store-data.ts) so legacy surfaces that read
 * student.feeTotal agree with the Fee engine:
 *   tuition band ×12 + management ₹500 (+ registration C9/C11, board form
 *   C10/C12, stream practicals ₹300/subject). Transport is intentionally
 *   NOT included — it is billed monthly and gated on opt-in.
 */
function baseAnnualFor(c: { id: string; grade: number }): number {
  const tuition = c.grade >= 11 ? 400 : c.grade >= 9 ? 300 : 250
  let total = tuition * 12 + 500 // Management & Maintenance
  if (c.grade === 9 || c.grade === 11) total += 300 // Registration fee (entry points)
  if (c.grade === 10 || c.grade === 12) total += 1500 // Board form fee
  if (c.id.endsWith('-PCM')) total += 600       // Physics + Chemistry practical
  else if (c.id.endsWith('-PCB')) total += 900  // Physics + Chemistry + Biology practical
  return total
}

function sr(seed: number): () => number { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 } }

function genStudents(): StudentRecord[] {
  const r = sr(42); const out: StudentRecord[] = []; let n = 1
  const usedNames = new Set<string>()
  CLASS_DEFS.forEach((c) => c.sections.forEach((sec) => {
    for (let i = 0; i < 2; i++) {
      const f = FIRST[Math.floor(r() * FIRST.length)], l = LAST[Math.floor(r() * LAST.length)]
      // §15 DEMO HYGIENE — unique student identities: on a PRNG name collision,
      // step deterministically through the LAST pool instead of re-rolling.
      // No extra PRNG draws are consumed, so every other seeded field keeps
      // its exact value; only the duplicated student's surname moves.
      let li = LAST.indexOf(l)
      while (usedNames.has(`${f} ${LAST[li]}`)) li = (li + 1) % LAST.length
      const studentName = `${f} ${LAST[li]}`
      usedNames.add(studentName)
      const fi = Math.floor(r() * DADS.length), h = HOUSE_DEFS[Math.floor(r() * 4)]
      const att = Math.round(80 + r() * 20), pct = Math.round(60 + r() * 35)
      const gr = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : 'C'
      const ft = baseAnnualFor(c)
      // FEE-POLICY — deterministic financial identity (no RNG dependency).
      // Status / transport / concession derive from the roster index so the
      // Fees engine, Students panel, search deep-links and parent dashboards
      // all agree exactly on payable/paid/due.
      const STATUS_CYCLE: FeeStatus[] = ['Partial', 'Paid', 'Partial', 'Pending', 'Paid', 'Partial', 'Paid', 'Pending', 'Partial', 'Paid']
      const wantsTransport = n % 3 !== 0          // ≈2/3 opt into the bus service
      const concession = n % 8 === 3 ? 500 : 0    // sibling / scholarship ≡ ₹500
      const transportAnnual = 6000                // ₹500/mo × 12 (sync FEE_POLICY.transportMonthly)
      void ft
      const fs: FeeStatus = STATUS_CYCLE[n % 10]
      out.push({
        id: `STU-${n}`, admissionNo: `DSO${2024000 + n}`, rollNo: String(i + 1).padStart(2, '0'),
        name: studentName, avatar: `${studentName.split(' ')[0][0]}${studentName.split(' ')[1][0]}`, gender: r() > 0.48 ? 'Male' : 'Female',
        classId: c.id, className: c.name, section: sec,
        dob: `${2017 - c.grade}-0${Math.floor(r() * 9) + 1}-0${Math.floor(r() * 9) + 1}`,
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][Math.floor(r() * 4)],
        category: ['General', 'OBC', 'SC', 'ST', 'EWS'][Math.floor(r() * 5)],
        fatherName: DADS[fi], motherName: MOMS[fi], guardianName: DADS[fi],
        guardianPhone: `+91 9${String(Math.floor(r() * 900000000 + 100000000))}`,
        guardianEmail: `${DADS[fi].split(' ')[0].toLowerCase()}.${DADS[fi].split(' ')[1].toLowerCase()}@gmail.com`,
        address: ADDR[Math.floor(r() * ADDR.length)], city: 'Gurugram', state: 'Haryana',
        admissionDate: `2024-04-0${Math.floor(r() * 3) + 1}`, previousSchool: ['Little Stars', 'Kidzee', 'Eurokids'][Math.floor(r() * 3)],
        status: 'Active', attendance: att, feeStatus: fs,
        feePaid: fs === 'Paid'
          ? baseAnnualFor(c) + (wantsTransport ? transportAnnual : 0) - concession
          : fs === 'Partial'
            ? Math.round((baseAnnualFor(c) + (wantsTransport ? transportAnnual : 0) - concession) * 0.5)
            : Math.round((baseAnnualFor(c) + (wantsTransport ? transportAnnual : 0) - concession) * 0.2),
        feeTotal: baseAnnualFor(c) + (wantsTransport ? transportAnnual : 0),
        transport: wantsTransport, hostel: false, scholarship: concession,
        houseId: h.id, houseName: h.name, medical: MED[Math.floor(r() * MED.length)],
        academics: {
          overallGrade: gr, overallPercent: pct, rankInClass: i + 1,
          subjects: SUBJECTS_BY_LEVEL[c.level].map((subj) => {
            const sp = Math.round(55 + r() * 44)
            return { name: subj, grade: sp >= 90 ? 'A+' : sp >= 80 ? 'A' : sp >= 70 ? 'B+' : sp >= 60 ? 'B' : 'C', percent: sp, teacher: DADS[Math.floor(r() * DADS.length)].split(' ')[0] + ' Sir' }
          }),
        },
        attendanceTrend: [{ month: 'Apr', percent: att }, { month: 'May', percent: Math.round(80 + r() * 20) }, { month: 'Jun', percent: Math.round(80 + r() * 20) }, { month: 'Jul', percent: Math.round(80 + r() * 20) }, { month: 'Aug', percent: Math.round(80 + r() * 20) }, { month: 'Sep', percent: Math.round(80 + r() * 20) }],
        disciplinePoints: Math.round(r() * 20),
        disciplineRecords: r() > 0.7 ? [{ date: '2025-08-15', type: 'Positive', description: 'Helped organize class event', points: 5 }] : r() > 0.8 ? [{ date: '2025-09-10', type: 'Warning', description: 'Late to class', points: -2 }] : [],
        documents: [
          { id: `doc-${n}-1`, title: 'Birth Certificate', type: 'ID Proof', uploadedDate: '2024-04-01', verified: true },
          { id: `doc-${n}-2`, title: 'Previous School TC', type: 'Transfer', uploadedDate: '2024-04-01', verified: true },
          { id: `doc-${n}-3`, title: 'Aadhaar Card', type: 'ID Proof', uploadedDate: '2024-04-02', verified: r() > 0.3 },
        ],
        transportRoute: wantsTransport
          ? `Route ${String.fromCharCode(65 + (n % 6))}-${(n % 9) + 1}`
          : undefined,
        achievements: r() > 0.8 ? [{ title: 'Inter-School Quiz Winner', date: '2025-08-15', level: 'Inter-School' }] : [],
        timeline: [{ id: `tl-${n}`, type: 'admission' as const, title: 'Admission Confirmed', description: `Admitted to ${c.name} - Sec ${sec}`, date: '2024-04-01', by: 'Dr. Ananya Iyer' }],
      })
      n++
    }
  }))
  return out
}

// ============================================================
// CLASS 2-A EXTENSION — the student/teacher-role class roster
// ------------------------------------------------------------
// The legacy student-role demo class (mock/students.ts rolls 03–18)
// is folded into the canonical roster so ONE store backs every
// role. Rolls 01–02 are the generated students (STU-9/STU-10);
// these 16 records continue the roster as STU-43..STU-58 with
// fresh admission numbers (DSO2024043..DSO2024058) — no collision
// with the generated DSO2024xxx series. The demo student is
// STU-58 (Aarav Sharma, roll 18, father Vikram Sharma).
// Fee figures follow the C05 fee-engine scale (₹3,500 base +
// ₹6,000 transport), NOT the retired ₹86,000 legacy numbers.
// ============================================================

const C2A_TEACHERS: Record<string, string> = {
  Maths: 'Rohan Mehta',
  English: 'Priya Nair',
  Hindi: 'Meera Krishnan',
  Science: 'Kavita Joshi',
  'Social Science': 'Vikram Singh',
  'Arts & Drawing': 'Faisal Ahmed',
}

const C2A_ROWS: {
  roll: string; name: string; gender: Gender; dob: string; blood: string
  father: string; mother: string; phone: string; email: string; address: string
  admOn: string; prev: string; att: number; fee: FeeStatus; transport: boolean
  medical: string; pct: number
}[] = [
  { roll: '03', name: 'Vivaan Reddy', gender: 'Male', dob: '2017-03-15', blood: 'B+', father: 'Karthik Reddy', mother: 'Lakshmi Reddy', phone: '+91 98300 34567', email: 'karthik.r@gmail.com', address: 'C-23, Sushant Lok', admOn: '2024-04-02', prev: 'Eurokids', att: 92, fee: 'Partial', transport: false, medical: 'Asthma — carries inhaler', pct: 89 },
  { roll: '04', name: 'Ananya Singh', gender: 'Female', dob: '2017-06-08', blood: 'O-', father: 'Arvind Singh', mother: 'Meera Singh', phone: '+91 98400 45678', email: 'arvind.singh@gmail.com', address: 'D-67, Palam Vihar', admOn: '2024-04-01', prev: 'Bachpan Play School', att: 99, fee: 'Paid', transport: true, medical: 'No known allergies', pct: 88 },
  { roll: '05', name: 'Reyansh Kumar', gender: 'Male', dob: '2017-02-18', blood: 'A+', father: 'Sandeep Kumar', mother: 'Ritu Kumar', phone: '+91 98500 56789', email: 'sandeep.k@gmail.com', address: 'E-89, Sector 56', admOn: '2024-04-03', prev: 'Tree House', att: 88, fee: 'Pending', transport: true, medical: 'Peanut allergy', pct: 84 },
  { roll: '06', name: 'Ishaani Verma', gender: 'Female', dob: '2017-07-30', blood: 'AB+', father: 'Manish Verma', mother: 'Kavita Verma', phone: '+91 98600 67890', email: 'manish.v@gmail.com', address: 'F-34, Sector 40', admOn: '2024-04-01', prev: 'Little Stars', att: 95, fee: 'Paid', transport: false, medical: 'No known allergies', pct: 87 },
  { roll: '07', name: 'Aditya Nair', gender: 'Male', dob: '2017-01-25', blood: 'B-', father: 'Vinod Nair', mother: 'Deepa Nair', phone: '+91 98700 78901', email: 'vinod.nair@gmail.com', address: 'G-56, Sector 23', admOn: '2024-04-02', prev: 'Kidzee', att: 94, fee: 'Paid', transport: true, medical: 'No known allergies', pct: 86 },
  { roll: '08', name: 'Saanvi Gupta', gender: 'Female', dob: '2017-08-14', blood: 'O+', father: 'Rajesh Gupta', mother: 'Anjali Gupta', phone: '+91 98800 89012', email: 'rajesh.g@gmail.com', address: 'H-78, Sector 15', admOn: '2024-04-01', prev: 'Eurokids', att: 97, fee: 'Paid', transport: false, medical: 'Dust allergy', pct: 90 },
  { roll: '09', name: 'Arjun Mehta', gender: 'Male', dob: '2017-09-05', blood: 'A-', father: 'Tarun Mehta', mother: 'Shweta Mehta', phone: '+91 98900 90123', email: 'tarun.m@gmail.com', address: 'I-90, DLF Phase 5', admOn: '2024-04-03', prev: 'Bachpan', att: 91, fee: 'Partial', transport: true, medical: 'No known allergies', pct: 85 },
  { roll: '10', name: 'Myra Iyer', gender: 'Female', dob: '2017-10-19', blood: 'AB-', father: 'Sriram Iyer', mother: 'Geeta Iyer', phone: '+91 99000 01234', email: 'sriram.i@gmail.com', address: 'J-12, Sector 31', admOn: '2024-04-01', prev: 'Little Stars', att: 99, fee: 'Paid', transport: true, medical: 'No known allergies', pct: 96 },
  { roll: '11', name: 'Kabir Khanna', gender: 'Male', dob: '2017-11-22', blood: 'O+', father: 'Harish Khanna', mother: 'Renu Khanna', phone: '+91 99100 12340', email: 'harish.k@gmail.com', address: 'K-34, Sector 42', admOn: '2024-04-02', prev: 'Tree House', att: 85, fee: 'Pending', transport: false, medical: 'Egg allergy', pct: 83 },
  { roll: '12', name: 'Kiara Rao', gender: 'Female', dob: '2017-12-11', blood: 'B+', father: 'Ganesh Rao', mother: 'Sumathi Rao', phone: '+91 99200 23451', email: 'ganesh.r@gmail.com', address: 'L-56, Sector 49', admOn: '2024-04-01', prev: 'Kidzee', att: 96, fee: 'Paid', transport: true, medical: 'No known allergies', pct: 89 },
  { roll: '13', name: 'Vihaan Agarwal', gender: 'Male', dob: '2017-04-28', blood: 'A+', father: 'Pradeep Agarwal', mother: 'Sunita Agarwal', phone: '+91 99300 34562', email: 'pradeep.a@gmail.com', address: 'M-78, Sector 28', admOn: '2024-04-03', prev: 'Eurokids', att: 93, fee: 'Paid', transport: true, medical: 'No known allergies', pct: 88 },
  { roll: '14', name: 'Anika Desai', gender: 'Female', dob: '2017-05-17', blood: 'O-', father: 'Mukesh Desai', mother: 'Hetal Desai', phone: '+91 99400 45673', email: 'mukesh.d@gmail.com', address: 'N-90, Sector 12', admOn: '2024-04-01', prev: 'Bachpan', att: 98, fee: 'Paid', transport: false, medical: 'No known allergies', pct: 94 },
  { roll: '15', name: 'Dhruv Joshi', gender: 'Male', dob: '2017-06-25', blood: 'AB+', father: 'Nilesh Joshi', mother: 'Priti Joshi', phone: '+91 99500 56784', email: 'nilesh.j@gmail.com', address: 'O-23, Sector 22', admOn: '2024-04-02', prev: 'Little Stars', att: 90, fee: 'Partial', transport: true, medical: 'No known allergies', pct: 85 },
  { roll: '16', name: 'Aadhya Menon', gender: 'Female', dob: '2017-07-09', blood: 'B-', father: 'Suresh Menon', mother: 'Latha Menon', phone: '+91 99600 67895', email: 'suresh.m@gmail.com', address: 'P-45, Sector 9', admOn: '2024-04-01', prev: 'Tree House', att: 97, fee: 'Paid', transport: true, medical: 'No known allergies', pct: 90 },
  { roll: '17', name: 'Sai Pillai', gender: 'Male', dob: '2017-08-02', blood: 'A+', father: 'Mohan Pillai', mother: 'Radha Pillai', phone: '+91 99700 78906', email: 'mohan.p@gmail.com', address: 'Q-67, Sector 17', admOn: '2024-04-03', prev: 'Kidzee', att: 89, fee: 'Pending', transport: false, medical: 'No known allergies', pct: 84 },
  { roll: '18', name: 'Aarav Sharma', gender: 'Male', dob: '2017-09-27', blood: 'O+', father: 'Vikram Sharma', mother: 'Neha Sharma', phone: '+91 99800 89017', email: 'vikram.s@gmail.com', address: 'R-89, Sector 14', admOn: '2024-04-01', prev: 'Eurokids', att: 96, fee: 'Partial', transport: true, medical: 'No known allergies', pct: 91 },
]

const gradeFor = (p: number) => (p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B+' : p >= 60 ? 'B' : 'C')

const CLASS_2A_EXTRA: StudentRecord[] = C2A_ROWS.map((row, i) => {
  const n = 43 + i
  const feeTotal = 3500 + (row.transport ? 6000 : 0)
  const house = HOUSE_DEFS[i % 4]
  const pct = Math.min(100, row.pct)
  const subjects = SUBJECTS_BY_LEVEL['Primary'].map((subj) => {
    const offsets: Record<string, number> = { Hindi: -2, English: 1, Science: -1, Maths: 2, 'Social Science': -3, 'Arts & Drawing': 3 }
    const p = Math.min(100, Math.max(40, pct + (offsets[subj] ?? 0)))
    return { name: subj, grade: gradeFor(p), percent: p, teacher: C2A_TEACHERS[subj] ?? 'Rohan Mehta' }
  })
  return {
    id: `STU-${n}`,
    admissionNo: `DSO${2024000 + n}`,
    rollNo: row.roll,
    name: row.name,
    avatar: `${row.name.split(' ')[0][0]}${row.name.split(' ')[1][0]}`,
    gender: row.gender,
    classId: 'C05',
    className: 'Class 2',
    section: 'A',
    dob: row.dob,
    bloodGroup: row.blood,
    category: 'General',
    fatherName: row.father,
    motherName: row.mother,
    guardianName: row.father,
    guardianPhone: row.phone,
    guardianEmail: row.email,
    city: 'Gurugram',
    state: 'Haryana',
    hostel: false,
    disciplinePoints: 0,
    address: `${row.address}, Gurugram`,
    admissionDate: row.admOn,
    previousSchool: row.prev,
    status: 'Active' as const,
    attendance: row.att,
    feeStatus: row.fee,
    feePaid: row.fee === 'Paid' ? feeTotal : row.fee === 'Partial' ? Math.round(feeTotal / 2) : Math.round(feeTotal * 0.2),
    feeTotal,
    transport: row.transport,
    scholarship: 0,
    houseId: house.id,
    houseName: house.name,
    medical: row.medical,
    academics: {
      overallGrade: gradeFor(pct),
      overallPercent: pct,
      rankInClass: 0, // recomputed below from the full section roster
      subjects,
    },
    attendanceTrend: [
      { month: 'Apr', percent: Math.max(0, row.att - 1) },
      { month: 'May', percent: row.att },
      { month: 'Jun', percent: Math.min(100, row.att + 1) },
      { month: 'Jul', percent: row.att },
      { month: 'Aug', percent: Math.max(0, row.att - 1) },
      { month: 'Sep', percent: row.att },
    ],
    disciplineRecords: [],
    documents: [
      { id: `doc-${n}-1`, title: 'Birth Certificate', type: 'ID Proof', uploadedDate: '2024-04-01', verified: true },
      { id: `doc-${n}-2`, title: 'Previous School TC', type: 'Transfer', uploadedDate: '2024-04-01', verified: true },
      { id: `doc-${n}-3`, title: 'Aadhaar Card', type: 'ID Proof', uploadedDate: '2024-04-02', verified: true },
    ],
    transportRoute: row.transport ? `Route ${String.fromCharCode(65 + (n % 6))}-${(n % 9) + 1}` : undefined,
    achievements: row.name === 'Aarav Sharma' ? [{ title: 'Inter-School Quiz Winner', date: '2025-08-15', level: 'Inter-School' }] : [],
    timeline: [{ id: `tl-${n}`, type: 'admission' as const, title: 'Admission Confirmed', description: 'Admitted to Class 2 - Sec A', date: row.admOn, by: 'Dr. Ananya Iyer' }],
  }
})

/** Recompute `rankInClass` from the FULL section roster (percent desc) so the
 *  18-student Class 2-A has coherent ranks (top 3: Myra, Anika, Aarav). */
function recomputeSectionRanks(students: StudentRecord[]): StudentRecord[] {
  const groups = new Map<string, StudentRecord[]>()
  for (const s of students) {
    const k = `${s.classId}|${s.section}`
    groups.set(k, [...(groups.get(k) ?? []), s])
  }
  const rankById = new Map<string, number>()
  for (const g of groups.values()) {
    ;[...g]
      .sort((a, b) => b.academics.overallPercent - a.academics.overallPercent)
      .forEach((s, i) => rankById.set(s.id, i + 1))
  }
  return students.map((s) => ({
    ...s,
    academics: { ...s.academics, rankInClass: rankById.get(s.id) ?? s.academics.rankInClass },
  }))
}

function genClasses(): ClassRecord[] {
  // For each seed class, derive a sensible Assistant Class Teacher
  // (different from the Class Teacher) and a per-subject teacher map
  // (based on the canonical subjects for that level + teacher pool).
  const ASSISTANT_BY_CLASS: Record<string, string> = {
    'C01': 'T-005', // Priya Nair's colleague — Meera Krishnan
    'C03': 'T-002', // Sunita Rao's colleague — Priya Nair
    'C05': 'T-011', // Rohan Mehta's colleague — Kavita Joshi
    'C07': 'T-023', // Deepa Menon's colleague — Vikram Singh
    'C09': 'T-032', // Neha Gupta's colleague — Anjali Desai
    'C11': 'T-029', // Anjali Desai's colleague — Suresh Pillai
    'C12': 'T-038', // Rajesh Khanna's colleague — Pooja Bhatt
    'C13': 'T-041', // Pooja Bhatt's colleague — Arjun Kapoor
    // Class 11/12 stream classes (Spec §4 — one ClassRecord per grade+stream)
    'C14-PCM': 'T-044', // Arjun Kapoor's colleague — Shalini Agarwal
    'C14-PCB': 'T-041',
    'C15-PCM': 'T-050', // Shalini Agarwal's colleague — Lakshmi Venkat
    'C15-PCB': 'T-047',
  }
  // Per-section assistant overrides (mostly undefined → uses class-level assistant).
  // Section-level Class Teacher overrides are populated so "Separate by section"
  // mode shows distinct teachers per section.
  const SECTION_TEACHERS: Record<string, string> = {
    'C05-A': 'T-014', // Rohan Mehta
    'C05-B': 'T-011', // Kavita Joshi
    'C05-C': 'T-017', // Amit Verma
    'C07-A': 'T-020', // Deepa Menon
    'C07-B': 'T-023', // Vikram Singh
    'C09-A': 'T-026', // Neha Gupta
    'C09-B': 'T-032', // Anjali Desai
    'C11-A': 'T-029', // Suresh Pillai
    'C11-B': 'T-032', // Anjali Desai
    'C12-A': 'T-035', // Rajesh Khanna
    'C12-B': 'T-038', // Pooja Bhatt
    'C13-A': 'T-038', // Pooja Bhatt
    'C13-B': 'T-041', // Arjun Kapoor
    // Class 11/12 stream class sections (Spec §4 — single section 'A')
    'C14-PCM-A': 'T-041',
    'C14-PCB-A': 'T-044',
    'C15-PCM-A': 'T-041',
    'C15-PCB-A': 'T-044',
    'C01-A': 'T-002',
    'C01-B': 'T-005',
    'C03-A': 'T-008',
    'C03-B': 'T-002',
  }
  const SECTION_ASSISTANTS: Record<string, string> = {
    'C05-A': 'T-011', // Kavita Joshi as Section A assistant
    'C07-A': 'T-023',
    'C09-A': 'T-032',
  }
  return CLASS_DEFS.map((c) => {
    // Resolve canonical subject ids from the new academic catalog
    // (Spec §28). Falls back to SUBJECTS_BY_LEVEL names if a class def
    // somehow has no subjectIds (defensive — should not happen).
    const subjectIds: string[] = c.subjectIds && c.subjectIds.length > 0
      ? [...c.subjectIds]
      : (SUBJECTS_BY_LEVEL[c.level] || [])
          .map((name) => SEED_SUBJECTS.find((s) => s.name === name)?.id)
          .filter((id): id is string => Boolean(id))
    // Subject display names (legacy convenience — derived from ids + registry).
    const subjects: string[] = subjectIds
      .map((id) => SEED_SUBJECTS.find((s) => s.id === id)?.name)
      .filter((n): n is string => Boolean(n))
    // Stream key (Spec §4) — only set for Class 11/12 Science streams.
    const stream: StreamKey | null = c.stream ? streamKeyFromDbValue(c.stream) : null

    // Subject teacher map — for the first 3 subjects, assign the class teacher;
    // for the rest, rotate through a small pool of related teachers.
    // Keyed by subject ID (canonical — survives renames).
    const subjectTeachers: Record<string, string> = {}
    const altPool = ['T-011', 'T-014', 'T-017', 'T-020', 'T-023']
    subjectIds.forEach((subId, i) => {
      subjectTeachers[subId] = i % 2 === 0 ? c.classTeacherId : altPool[i % altPool.length]
    })
    // C05 (Class 2) — aligned with the REAL roster (and the principal Timetable
    // slot mappings): Priya Nair English, Meera Krishnan Hindi, Kavita Joshi
    // Science, Rohan Mehta Maths, Vikram Singh Social Science, Faisal Ahmed
    // Arts. The student-side academics/timetable/homework teachers match this
    // map (STU-B class-2-A extension).
    if (c.id === 'C05') {
      subjectTeachers['sub-hindi'] = 'T-005'
      subjectTeachers['sub-english'] = 'T-002'
      subjectTeachers['sub-science'] = 'T-011'
      subjectTeachers['sub-maths'] = 'T-014'
      subjectTeachers['sub-sst'] = 'T-023'
      subjectTeachers['sub-arts'] = 'T-053'
    }
    return {
      id: c.id, name: c.name, grade: c.grade, level: c.level,
      sections: c.sections.map((s) => ({
        id: `${c.id}-${s}`,
        name: s,
        classId: c.id,
        capacity: c.capacity,
        classTeacherId: SECTION_TEACHERS[`${c.id}-${s}`] ?? c.classTeacherId,
        assistantTeacherId: SECTION_ASSISTANTS[`${c.id}-${s}`],
        room: c.room,
      })),
      capacity: c.capacity,
      classTeacherId: c.classTeacherId,
      assistantTeacherId: ASSISTANT_BY_CLASS[c.id],
      subjectIds,
      subjects,
      archivedSubjects: [],
      subjectTeachers,
      stream,
      room: c.room,
      status: 'Active' as const,
    }
  })
}

export const SS: StudentRecord[] = recomputeSectionRanks([...genStudents(), ...CLASS_2A_EXTRA])
export const SC: ClassRecord[] = genClasses()

// Assign senior students as house captains / vice-captains (deterministic).
// Spec §4 — Class 11/12 now have stream class ids (C14-PCM, C14-PCB, C15-PCM, C15-PCB).
const sn = SS.filter((s) =>
  s.classId === 'C15-PCM' || s.classId === 'C15-PCB' ||
  s.classId === 'C14-PCM' || s.classId === 'C14-PCB'
)
HOUSE_DEFS[0].captainId = sn[0]?.id; HOUSE_DEFS[0].viceCaptainId = sn[1]?.id
HOUSE_DEFS[1].captainId = sn[2]?.id; HOUSE_DEFS[1].viceCaptainId = sn[3]?.id
HOUSE_DEFS[2].captainId = sn[4]?.id; HOUSE_DEFS[2].viceCaptainId = sn[5]?.id
HOUSE_DEFS[3].captainId = sn[6]?.id; HOUSE_DEFS[3].viceCaptainId = sn[7]?.id
