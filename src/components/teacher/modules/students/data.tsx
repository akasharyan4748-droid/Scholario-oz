// Static data, types, and initial state for the Teacher Students module.

'use client'

import { useMemo } from 'react'
import type { Student } from '@/lib/mock/students'
import { useStudentsStore, type StudentRecord } from '@/lib/store/students-store'

export const progressData = [
  { name: 'UT1', v: 78 },
  { name: 'UT2', v: 82 },
  { name: 'Mid', v: 84 },
  { name: 'UT3', v: 88 },
]

export type Filter = 'all' | 'high' | 'at-risk'

// NOTE (PAY-REWORK-1): the old mock CashRequest re-admission data was
// removed — teacher fee collections now use the REAL canonical fee ledger
// (see fee-collections.tsx → fee-store.recordPayment).

// Deterministic math-score sequence used to render per-student math score chips.
export const scoreSequence = [48, 44, 38, 49, 36, 47, 42, 46, 40, 50, 32, 45, 41, 48, 39, 47, 35, 46]

// STU-B — the teacher's class roster now reads from the CANONICAL
// students-store (Class 2-A = C05-A, 18 students: STU-9/10 + STU-43..58),
// so the teacher, principal and student roles share ONE roster. The mock
// Student display shape is preserved via this adapter so the existing UI
// keeps working unchanged.
export function toTeacherStudent(s: StudentRecord): Student {
  const n = Number(s.id.replace('STU-', ''))
  return {
    id: s.id,
    admissionNo: s.admissionNo,
    rollNo: s.rollNo,
    name: s.name,
    avatar: s.avatar,
    gender: s.gender,
    className: s.className,
    section: s.section,
    dob: s.dob,
    bloodGroup: s.bloodGroup,
    fatherName: s.fatherName,
    motherName: s.motherName,
    guardianPhone: s.guardianPhone,
    email: s.guardianEmail,
    address: s.address,
    admissionDate: s.admissionDate,
    previousSchool: s.previousSchool,
    status: s.status === 'Active' ? 'Active' : 'Inactive',
    attendance: s.attendance,
    feeStatus: s.feeStatus,
    feePaid: s.feePaid,
    feeTotal: s.feeTotal,
    transport: s.transport,
    hostel: s.hostel,
    scholarship: s.scholarship,
    photo: s.avatar,
    libraryId: `LIB-${1000 + n}`,
    transportId: s.transportRoute,
    medical: s.medical,
  }
}

/** Reactive Class 2-A roster from the canonical students-store.
 *  (Raw array + useMemo — zustand v5 selectors must return stable refs.) */
export function useClass2AStudents(): Student[] {
  const allStudents = useStudentsStore((st) => st.students)
  return useMemo(
    () =>
      allStudents
        .filter((x) => x.classId === 'C05' && x.section === 'A' && x.status === 'Active')
        .map(toTeacherStudent),
    [allStudents],
  )
}
