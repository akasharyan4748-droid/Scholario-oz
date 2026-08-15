import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { db } from '@/lib/db'
import { computeAllResults, computeAnalytics } from '@/lib/exams/result-engine'
import type { StudentDTO, ExamSubjectConfigDTO, ExamMarkDTO, MarkStatus, WorkflowStatus } from '@/lib/exams/types'

export const runtime = 'nodejs'

// GET /api/exams/overview-analytics?classId=optional
export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const classFilter = searchParams.get('classId')

    const allExams = await db.exam.findMany({
      where: { schoolId },
      include: {
        examClasses: { include: { class: { include: { _count: { select: { students: true } } } } } },
        examSubjects: { include: { subject: true } },
        marks: { include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } } },
      },
      orderBy: { declaredAt: 'desc' },
    })

    const declaredExams = allExams.filter((e) => e.resultStatus === 'Result Declared')

    if (declaredExams.length === 0) {
      return { hasResults: false, latestExam: null, analytics: null, toppers: [], declaredExamCount: 0 }
    }

    const latestExam = declaredExams[0]
    const classId = classFilter || latestExam.examClasses[0]?.classId

    if (!classId) {
      return { hasResults: false, latestExam: null, analytics: null, toppers: [], declaredExamCount: declaredExams.length }
    }

    const students = await db.student.findMany({
      where: { classId, schoolId },
      orderBy: { rollNo: 'asc' },
      include: { user: { select: { name: true } }, class: { select: { name: true } } },
    })

    const studentDTOs: StudentDTO[] = students.map((s) => ({
      id: s.id, rollNo: s.rollNo, admissionNo: s.admissionNo,
      name: s.user?.name ?? '', classId: s.classId,
    }))

    const subjectDTOs: ExamSubjectConfigDTO[] = latestExam.examSubjects
      .filter((s) => s.classId === classId)
      .map((s) => ({
        id: s.id, examId: s.examId, classId: s.classId, subjectId: s.subjectId,
        subjectName: s.subject.name, subjectCode: s.subject.code,
        maxMarks: s.maxMarks, passMarks: s.passMarks,
        theoryMarks: s.theoryMarks, practicalMarks: s.practicalMarks, sortOrder: s.sortOrder,
      }))

    const markDTOs: ExamMarkDTO[] = latestExam.marks
      .filter((m) => m.classId === classId)
      .map((m) => ({
        id: m.id, examId: m.examId, classId: m.classId, subjectId: m.subjectId, studentId: m.studentId,
        studentName: m.student?.user?.name ?? '', studentRollNo: m.student?.rollNo ?? null,
        marksObtained: m.marksObtained, status: m.status as MarkStatus,
        workflowStatus: m.workflowStatus as WorkflowStatus,
        originalMarks: m.originalMarks, graceMarks: m.graceMarks ?? 0,
        graceReason: m.graceReason, remarks: m.remarks, enteredBy: m.enteredBy,
        enteredAt: m.enteredAt?.toISOString() ?? null,
        verifiedBy: m.verifiedBy, verifiedAt: m.verifiedAt?.toISOString() ?? null, lockedBy: m.lockedBy,
      }))

    if (studentDTOs.length === 0 || subjectDTOs.length === 0 || markDTOs.length === 0) {
      return {
        hasResults: false,
        latestExam: {
          id: latestExam.id, name: latestExam.name, type: latestExam.type,
          startDate: latestExam.startDate?.toISOString().split('T')[0] ?? null,
          endDate: latestExam.endDate?.toISOString().split('T')[0] ?? null,
        },
        analytics: null,
        toppers: [],
        declaredExamCount: declaredExams.length,
        className: students[0]?.class?.name ?? '',
      }
    }

    const className = students[0]?.class?.name ?? ''

    const results = computeAllResults({
      students: studentDTOs,
      subjects: subjectDTOs,
      marks: markDTOs,
      passPercentage: latestExam.passPercentage,
    })
    for (const r of results) r.className = className

    const analytics = computeAnalytics(
      { students: studentDTOs, subjects: subjectDTOs, marks: markDTOs, passPercentage: latestExam.passPercentage },
      className
    )

    const toppers = results
      .filter((r) => !r.isAbsentInAll)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
      .map((r, i) => ({
        rank: r.rank ?? i + 1,
        studentId: r.studentId,
        name: r.studentName,
        rollNo: r.rollNo,
        className: r.className,
        percentage: r.percentage,
        grade: r.grade,
        total: r.totalObtained,
        maxTotal: r.totalMax,
      }))

    // Trend: if multiple declared exams with data for this class
    const trend: Array<{ examName: string; averagePercentage: number; passRate: number }> = []
    for (const exam of [...declaredExams].reverse()) {
      const examStudents = await db.student.findMany({
        where: { classId, schoolId },
        orderBy: { rollNo: 'asc' },
        include: { user: { select: { name: true } } },
      })
      const examStudentDTOs: StudentDTO[] = examStudents.map((s) => ({
        id: s.id, rollNo: s.rollNo, admissionNo: s.admissionNo,
        name: s.user?.name ?? '', classId: s.classId,
      }))
      const examSubjectDTOs: ExamSubjectConfigDTO[] = exam.examSubjects
        .filter((s) => s.classId === classId)
        .map((s) => ({
          id: s.id, examId: s.examId, classId: s.classId, subjectId: s.subjectId,
          subjectName: s.subject.name, subjectCode: s.subject.code,
          maxMarks: s.maxMarks, passMarks: s.passMarks,
          theoryMarks: s.theoryMarks, practicalMarks: s.practicalMarks, sortOrder: s.sortOrder,
        }))
      const examMarkDTOs: ExamMarkDTO[] = exam.marks
        .filter((m) => m.classId === classId)
        .map((m) => ({
          id: m.id, examId: m.examId, classId: m.classId, subjectId: m.subjectId, studentId: m.studentId,
          studentName: m.student?.user?.name ?? '', studentRollNo: m.student?.rollNo ?? null,
          marksObtained: m.marksObtained, status: m.status as MarkStatus,
          workflowStatus: m.workflowStatus as WorkflowStatus,
          originalMarks: m.originalMarks, graceMarks: m.graceMarks ?? 0,
          graceReason: m.graceReason, remarks: m.remarks, enteredBy: m.enteredBy,
          enteredAt: m.enteredAt?.toISOString() ?? null,
          verifiedBy: m.verifiedBy, verifiedAt: m.verifiedAt?.toISOString() ?? null, lockedBy: m.lockedBy,
        }))

      if (examStudentDTOs.length > 0 && examSubjectDTOs.length > 0 && examMarkDTOs.length > 0) {
        const examAnalytics = computeAnalytics(
          { students: examStudentDTOs, subjects: examSubjectDTOs, marks: examMarkDTOs, passPercentage: exam.passPercentage },
          className
        )
        trend.push({
          examName: exam.name,
          averagePercentage: examAnalytics.averagePercentage,
          passRate: examAnalytics.passRate,
        })
      }
    }

    return {
      hasResults: true,
      latestExam: {
        id: latestExam.id,
        name: latestExam.name,
        type: latestExam.type,
        startDate: latestExam.startDate?.toISOString().split('T')[0] ?? null,
        endDate: latestExam.endDate?.toISOString().split('T')[0] ?? null,
      },
      analytics: {
        totalStudents: analytics.totalStudents,
        passed: analytics.passed,
        failed: analytics.failed,
        passRate: analytics.passRate,
        averagePercentage: analytics.averagePercentage,
        highestPercentage: analytics.highestPercentage,
        lowestPercentage: analytics.lowestPercentage,
        gradeDistribution: analytics.gradeDistribution,
        subjectPerformance: analytics.subjectPerformance,
      },
      toppers,
      className,
      trend: trend.length > 1 ? trend : [],
      declaredExamCount: declaredExams.length,
      needsAttention: results
        .filter((r) => !r.passed && !r.isAbsentInAll)
        .sort((a, b) => a.percentage - b.percentage)
        .slice(0, 5)
        .map((r) => ({
          studentId: r.studentId,
          name: r.studentName,
          rollNo: r.rollNo,
          className: r.className,
          percentage: r.percentage,
          grade: r.grade,
        })),
    }
  })
}
