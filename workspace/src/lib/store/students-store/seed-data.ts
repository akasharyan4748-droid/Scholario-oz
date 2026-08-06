import type { ClassRecord, FeeStatus, StudentRecord } from './types'
import { CLASS_DEFS, HOUSE_DEFS, SUBJECTS_BY_LEVEL } from './constants'

// ============================================================
// SEED DATA — Compact, generated lazily
// ============================================================

const FIRST: string[] = ['Aarav', 'Diya', 'Vivaan', 'Ananya', 'Reyansh', 'Saanvi', 'Arjun', 'Myra', 'Kabir', 'Kiara', 'Vihaan', 'Anika', 'Dhruv', 'Aadhya', 'Sai', 'Pari', 'Rohan', 'Riya', 'Karan', 'Nisha']
const LAST: string[] = ['Sharma', 'Patel', 'Reddy', 'Singh', 'Kumar', 'Verma', 'Nair', 'Gupta', 'Mehta', 'Iyer', 'Khanna', 'Rao', 'Agarwal', 'Desai', 'Joshi']
const DADS: string[] = ['Rahul Sharma', 'Nikhil Patel', 'Karthik Reddy', 'Arvind Singh', 'Sandeep Kumar', 'Manish Verma', 'Vinod Nair', 'Rajesh Gupta', 'Tarun Mehta', 'Sriram Iyer']
const MOMS: string[] = ['Pooja Sharma', 'Sneha Patel', 'Lakshmi Reddy', 'Meera Singh', 'Ritu Kumar', 'Kavita Verma', 'Deepa Nair', 'Anjali Gupta', 'Shweta Mehta', 'Geeta Iyer']
const ADDR: string[] = ['A-12, Sector 14, Gurugram', 'B-45, DLF Phase 3, Gurugram', 'C-23, Sushant Lok, Gurugram', 'D-67, Palam Vihar, Gurugram', 'E-89, Sector 56, Gurugram']
const MED: string[] = ['No known allergies', 'Asthma — carries inhaler', 'Peanut allergy', 'Lactose intolerant', 'Dust allergy']

function sr(seed: number): () => number { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 } }

function genStudents(): StudentRecord[] {
  const r = sr(42); const out: StudentRecord[] = []; let n = 1
  CLASS_DEFS.forEach((c) => c.sections.forEach((sec) => {
    for (let i = 0; i < 2; i++) {
      const f = FIRST[Math.floor(r() * FIRST.length)], l = LAST[Math.floor(r() * LAST.length)]
      const fi = Math.floor(r() * DADS.length), h = HOUSE_DEFS[Math.floor(r() * 4)]
      const att = Math.round(80 + r() * 20), pct = Math.round(60 + r() * 35)
      const gr = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : 'C'
      const ft = c.level === 'Senior Secondary' ? 92000 : c.level === 'Secondary' ? 88000 : c.level === 'Middle' ? 78000 : 68000
      const fs: FeeStatus = r() > 0.6 ? 'Paid' : r() > 0.4 ? 'Partial' : 'Pending'
      out.push({
        id: `STU-${n}`, admissionNo: `DSO${2024000 + n}`, rollNo: String(i + 1).padStart(2, '0'),
        name: `${f} ${l}`, avatar: `${f[0]}${l[0]}`, gender: r() > 0.48 ? 'Male' : 'Female',
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
        feePaid: fs === 'Paid' ? ft : fs === 'Partial' ? Math.round(ft * 0.5) : Math.round(ft * 0.2),
        feeTotal: ft, transport: r() > 0.4, hostel: false, scholarship: r() > 0.8 ? 5000 : 0,
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
        transportRoute: r() > 0.4 ? `Route ${String.fromCharCode(65 + Math.floor(r() * 6))}-${Math.floor(r() * 9) + 1}` : undefined,
        achievements: r() > 0.8 ? [{ title: 'Inter-School Quiz Winner', date: '2025-08-15', level: 'Inter-School' }] : [],
        timeline: [{ id: `tl-${n}`, type: 'admission' as const, title: 'Admission Confirmed', description: `Admitted to ${c.name} - Sec ${sec}`, date: '2024-04-01', by: 'Dr. Ananya Iyer' }],
      })
      n++
    }
  }))
  return out
}

function genClasses(): ClassRecord[] {
  return CLASS_DEFS.map((c) => ({
    id: c.id, name: c.name, grade: c.grade, level: c.level,
    sections: c.sections.map((s) => ({ id: `${c.id}-${s}`, name: s, classId: c.id, capacity: c.capacity, classTeacherId: c.classTeacherId, room: c.room })),
    capacity: c.capacity, classTeacherId: c.classTeacherId, subjects: SUBJECTS_BY_LEVEL[c.level], room: c.room, status: 'Active' as const,
  }))
}

export const SS: StudentRecord[] = genStudents()
export const SC: ClassRecord[] = genClasses()

// Assign senior students as house captains / vice-captains (deterministic).
const sn = SS.filter((s) => s.classId === 'C15' || s.classId === 'C14')
HOUSE_DEFS[0].captainId = sn[0]?.id; HOUSE_DEFS[0].viceCaptainId = sn[1]?.id
HOUSE_DEFS[1].captainId = sn[2]?.id; HOUSE_DEFS[1].viceCaptainId = sn[3]?.id
HOUSE_DEFS[2].captainId = sn[4]?.id; HOUSE_DEFS[2].viceCaptainId = sn[5]?.id
HOUSE_DEFS[3].captainId = sn[6]?.id; HOUSE_DEFS[3].viceCaptainId = sn[7]?.id
