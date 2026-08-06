import type { StateCreator } from 'zustand'
import type { AppointmentLetterData, TeachersStoreState } from '../types'

export const createWorkloadSlice: StateCreator<
  TeachersStoreState,
  [],
  [],
  Pick<TeachersStoreState, 'assignSubjectsAndClasses' | 'regenerateAppointmentLetter'>
> = (set, get) => ({
  assignSubjectsAndClasses: (teacherId, subjects, classes, examResp = []) => {
    const teacher = get().teachers.find((t) => t.id === teacherId)
    if (!teacher) return

    set((s) => ({
      teachers: s.teachers.map((t) =>
        t.id === teacherId ? { ...t, subjects, classes, examResponsibilities: examResp } : t
      ),
    }))

    get().logAudit({
      category: 'Subject Assigned',
      actorName: 'Dr. Ananya Iyer',
      actorRole: 'Principal',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `Updated workload: Subjects [${subjects.join(', ')}], Classes [${classes.join(', ')}]`,
    })
  },

  regenerateAppointmentLetter: (teacherId, customTerms, newSalary) => {
    const teacher = get().teachers.find((t) => t.id === teacherId)
    if (!teacher) return

    const currentSal = newSalary || teacher.salary
    const letter: AppointmentLetterData = {
      id: `APT-GWS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`,
      officialLetterNo: `GWS/APT/${new Date().getFullYear()}/${String(Math.floor(1000 + Math.random() * 8999))}`,
      generatedDate: new Date().toISOString().split('T')[0],
      teacherName: teacher.name,
      employeeId: teacher.employeeId,
      designation: teacher.designation,
      department: teacher.department,
      joiningDate: teacher.joiningDate,
      monthlySalary: currentSal,
      annualSalary: currentSal * 12,
      workingHours: '08:00 AM – 03:30 PM',
      probationMonths: 6,
      noticePeriodDays: 60,
      termsAndConditions: customTerms || [
        'Adherence to CBSE Curriculum guidelines and professional ethics.',
        'Maintain complete confidentiality regarding student academic & psychological records.',
        'Participate actively in co-curricular activities, exam proctoring, and parent-teacher meets.',
        'Notice period of 60 days required prior to resignation during academic session.',
      ],
      principalName: 'Dr. Ananya Iyer',
      qrVerificationId: 'QR-APT-EMP-014-2015D4E5F6',
      reportingAuthority: 'Dr. Ananya Iyer, Principal',
      schoolSealAttached: true,
      qrVerificationId: `QR-APT-${teacher.employeeId}-${Date.now().toString(36).toUpperCase()}`,
      reportingAuthority: 'Dr. Ananya Iyer, Principal',
    }

    set((s) => ({
      teachers: s.teachers.map((t) =>
        t.id === teacherId ? { ...t, salary: currentSal, appointmentLetter: letter } : t
      ),
    }))

    get().logAudit({
      category: 'Appointment Letter',
      actorName: 'Dr. Ananya Iyer',
      actorRole: 'Principal',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `Regenerated official Appointment Letter (${letter.id})`,
    })
  },
})
