/**
 * PDF smoke test — generate all 3 PDF types directly using Prisma +
 * the pure result-engine (bypassing server-only service).
 */
import { db } from '../src/lib/db'
import { computeAllResults, computeAnalytics } from '../src/lib/exams/result-engine'
import {
  generateClassGradeSheetPDF,
  generateStudentReportCardPDF,
  generateAdmitCardPDF,
} from '../src/components/principal/modules/exams/exams-pdf-real'
import { mkdirSync } from 'fs'
import { homedir } from 'os'

async function main() {
  mkdirSync(`${homedir()}/Downloads`, { recursive: true })
  
  const exam = await db.exam.findFirst({
    where: { name: 'Acceptance Test Exam' },
    include: {
      examClasses: { include: { class: { include: { _count: { select: { students: true } } } } } },
      examSubjects: { include: { subject: true } },
      scheduleItems: { include: { class: true, subject: true } },
      marks: { include: { student: { include: { user: { select: { name: true } } } } } },
    },
  })
  if (!exam) { console.log('No exam found'); return }
  
  const classLink = exam.examClasses[0]
  if (!classLink) { console.log('No class'); return }
  
  // Get real students
  const students = await db.student.findMany({
    where: { classId: classLink.classId, schoolId: exam.schoolId },
    orderBy: { rollNo: 'asc' },
    include: { user: { select: { name: true } } },
  })
  
  const studentDTOs = students.map((s) => ({
    id: s.id, rollNo: s.rollNo, admissionNo: s.admissionNo,
    name: s.user?.name ?? '', classId: s.classId,
  }))
  const subjectDTOs = exam.examSubjects.map((s) => ({
    id: s.id, examId: s.examId, classId: s.classId, subjectId: s.subjectId,
    subjectName: s.subject.name, subjectCode: s.subject.code,
    maxMarks: s.maxMarks, passMarks: s.passMarks,
    theoryMarks: s.theoryMarks, practicalMarks: s.practicalMarks, sortOrder: s.sortOrder,
  }))
  const markDTOs = exam.marks.map((m) => ({
    id: m.id, examId: m.examId, classId: m.classId, subjectId: m.subjectId, studentId: m.studentId,
    studentName: m.student?.user?.name ?? '', studentRollNo: m.student?.rollNo ?? null,
    marksObtained: m.marksObtained, status: m.status, workflowStatus: m.workflowStatus,
    originalMarks: m.originalMarks, graceMarks: m.graceMarks ?? 0, graceReason: m.graceReason,
    remarks: m.remarks, enteredBy: m.enteredBy,
    enteredAt: m.enteredAt?.toISOString() ?? null,
    verifiedBy: m.verifiedBy, verifiedAt: m.verifiedAt?.toISOString() ?? null, lockedBy: m.lockedBy,
  }))
  
  const results = computeAllResults({
    students: studentDTOs, subjects: subjectDTOs, marks: markDTOs, passPercentage: exam.passPercentage,
  })
  for (const r of results) r.className = classLink.class.name
  
  const analytics = computeAnalytics({
    students: studentDTOs, subjects: subjectDTOs, marks: markDTOs, passPercentage: exam.passPercentage,
  }, classLink.class.name)
  
  const examDto = {
    id: exam.id, schoolId: exam.schoolId, name: exam.name,
    type: exam.type, session: exam.session, term: exam.term,
    status: exam.status, resultStatus: exam.resultStatus,
    passPercentage: exam.passPercentage,
    startDate: exam.startDate?.toISOString().split('T')[0] ?? null,
    endDate: exam.endDate?.toISOString().split('T')[0] ?? null,
    declaredAt: exam.declaredAt?.toISOString() ?? null,
    declaredBy: exam.declaredBy, createdBy: exam.createdBy,
    createdAt: exam.createdAt.toISOString(), updatedAt: exam.updatedAt.toISOString(),
    classes: [], subjects: [], schedule: [],
    markSummary: { total: 0, entered: 0, locked: 0, submitted: 0, verified: 0, pct: 0 },
  }
  
  console.log(`Exam: ${exam.name}, Class: ${classLink.class.name}, Students: ${students.length}`)
  console.log(`Results: ${results.length}, Pass rate: ${analytics.passRate}%\n`)
  
  // 1. Class Grade Sheet
  const gs = generateClassGradeSheetPDF(examDto, classLink.class.name, results, analytics)
  console.log(`✓ Class Grade Sheet: ${gs.filename}`)
  
  // 2. Individual Report Card
  const first = results[0]
  if (first) {
    const rc = generateStudentReportCardPDF(examDto, classLink.class.name, {
      id: first.studentId, name: first.studentName, rollNo: first.rollNo,
    }, first)
    console.log(`✓ Report Card: ${rc.filename} (for ${first.studentName})`)
  }
  
  // 3. Admit Card
  const scheduleDto = exam.scheduleItems.map((s) => ({
    id: s.id, examId: s.examId, classId: s.classId, className: s.class.name,
    subjectId: s.subjectId, subjectName: s.subject?.name ?? null,
    date: s.date.toISOString().split('T')[0],
    startTime: s.startTime, endTime: s.endTime, room: s.room,
    invigilatorId: s.invigilatorId, invigilatorName: s.invigilatorName,
  }))
  if (students[0] && scheduleDto.length > 0) {
    const ac = generateAdmitCardPDF(examDto, classLink.class.name, {
      id: students[0].id, name: students[0].user?.name ?? '',
      rollNo: students[0].rollNo, admissionNo: students[0].admissionNo,
    }, scheduleDto)
    console.log(`✓ Admit Card: ${ac.filename}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => await db.$disconnect())
