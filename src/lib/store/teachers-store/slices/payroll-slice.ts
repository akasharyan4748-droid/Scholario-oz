import type { StateCreator } from 'zustand'
import type { TeachersStoreState } from '../types'

export const createPayrollSlice: StateCreator<
  TeachersStoreState,
  [],
  [],
  Pick<TeachersStoreState, 'requestPayrollRevision' | 'confirmPayrollRevision'>
> = (set, get) => ({
  requestPayrollRevision: (teacherId, newSalary) => {
    const teacher = get().teachers.find((t) => t.id === teacherId)
    if (!teacher) return { code: '' }

    const code = `PAY-${Math.floor(100000 + Math.random() * 900000)}`
    const basic = Math.round(newSalary * 0.5)
    const hra = Math.round(newSalary * 0.2)
    const da = Math.round(newSalary * 0.15)
    const specialAllowance = Math.round(newSalary * 0.1)
    const pfDeduction = Math.round(basic * 0.1)
    const netPay = basic + hra + da + specialAllowance - pfDeduction

    const proposal = {
      proposalId: `PROP-${Date.now()}`,
      proposedSalary: newSalary,
      code,
      date: new Date().toISOString().split('T')[0],
      proposedBreakdown: { basic, hra, da, specialAllowance, pfDeduction, netPay },
    }

    set((s) => ({
      teachers: s.teachers.map((t) =>
        t.id === teacherId ? { ...t, pendingPayrollUpdate: proposal } : t
      ),
    }))

    get().logAudit({
      category: 'Salary Updated',
      actorName: 'Dr. Ananya Iyer',
      actorRole: 'Principal',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `Requested payroll revision to ₹${newSalary.toLocaleString('en-IN')}. Confirmation Code: ${code} sent to teacher panel.`,
    })

    return { code }
  },

  confirmPayrollRevision: (teacherId, code) => {
    const teacher = get().teachers.find((t) => t.id === teacherId)
    if (!teacher || !teacher.pendingPayrollUpdate) return false

    if (teacher.pendingPayrollUpdate.code.trim().toUpperCase() !== code.trim().toUpperCase()) {
      return false
    }

    const prop = teacher.pendingPayrollUpdate
    set((s) => ({
      teachers: s.teachers.map((t) =>
        t.id === teacherId
          ? {
              ...t,
              salary: prop.proposedSalary,
              salaryBreakdown: prop.proposedBreakdown,
              pendingPayrollUpdate: undefined,
            }
          : t
      ),
    }))

    get().logAudit({
      category: 'Salary Updated',
      actorName: teacher.name,
      actorRole: 'Teacher',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `Teacher confirmed payroll revision code ${code}. Salary updated to ₹${prop.proposedSalary.toLocaleString('en-IN')}.`,
    })

    return true
  },
})
