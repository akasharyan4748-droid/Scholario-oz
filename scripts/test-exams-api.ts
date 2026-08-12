/**
 * End-to-end smoke test for the exams API as Principal.
 * 1. Login as principal@greenwood.edu.in
 * 2. List exams (GET /api/exams)
 * 3. Create a real exam (POST /api/exams) with Grade 9-A class + 3 subjects
 * 4. Get the exam back (GET /api/exams/[id])
 * 5. Get students for the class (GET /api/exams/[id]/marks?classId=...)
 * 6. Enter marks for a few students (POST /api/exams/[id]/marks/single)
 * 7. Submit marks (POST /api/exams/[id]/marks/submit)
 * 8. Verify marks (POST /api/exams/[id]/marks/verify)
 * 9. Lock marks (POST /api/exams/[id]/marks/lock)
 * 10. Get results (GET /api/exams/[id]/results/class/[classId])
 * 11. Declare results (POST /api/exams/[id]/results/declare)
 * 12. Refresh — confirm exam persists
 */
import { db } from '../src/lib/db'

const BASE = 'http://localhost:3000'

async function main() {
  console.log('=== Exams API end-to-end test ===\n')

  // Step 1: Login as principal@greenwood.edu.in
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'principal@greenwood.edu.in', password: 'principal123' }),
  })
  const setCookie = loginRes.headers.get('set-cookie') || ''
  const cookie = setCookie.split(';')[0]
  console.log('1. Login status:', loginRes.status, '| cookie:', cookie.slice(0, 50) + '...')
  if (loginRes.status !== 200) {
    console.log('Login failed:', await loginRes.text())
    return
  }
  const headers = { cookie, 'content-type': 'application/json' }

  // Step 2: List exams + classes (GET /api/exams)
  let res = await fetch(`${BASE}/api/exams`, { headers })
  let body = await res.json()
  console.log(`2. GET /api/exams → HTTP ${res.status} | ${body?.data?.exams?.length ?? 0} exams, ${body?.data?.classes?.length ?? 0} classes`)
  if (!body?.data?.classes?.length) {
    console.log('No classes found. Aborting.')
    return
  }
  const allClasses = body.data.classes
  const targetClass = allClasses[0]
  console.log(`   Target class: ${targetClass.name} (id=${targetClass.id}) with ${targetClass.studentCount} students, ${targetClass.subjects.length} subjects`)
  const targetSubjectIds = targetClass.subjects.slice(0, 3).map((s: any) => s.id)
  console.log(`   Using subjects: ${targetClass.subjects.slice(0, 3).map((s: any) => s.name).join(', ')}`)

  // Step 3: Create exam
  const examName = `E2E Test Exam ${new Date().toISOString().split('T')[1].slice(0, 8)}`
  res = await fetch(`${BASE}/api/exams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: examName,
      type: 'Unit Test',
      session: '2025-2026',
      startDate: '2026-09-15',
      endDate: '2026-09-20',
      passPercentage: 33,
      classIds: [targetClass.id],
      subjectsByClass: {
        [targetClass.id]: targetSubjectIds.map((subjectId: string, i: number) => ({
          subjectId,
          maxMarks: 50,
          passMarks: 17,
          theoryMarks: 50,
          practicalMarks: 0,
        })),
      },
      schedule: targetSubjectIds.map((subjectId: string, i: number) => ({
        classId: targetClass.id,
        subjectId,
        date: `2026-09-${15 + i}`,
        startTime: '09:00',
        endTime: '10:00',
        room: `Room ${100 + i}`,
        invigilatorName: 'Rohan Mehta',
      })),
    }),
  })
  body = await res.json()
  console.log(`3. POST /api/exams → HTTP ${res.status} | exam id=${body?.data?.id}`)
  if (res.status !== 200) {
    console.log('   ERROR:', JSON.stringify(body))
    return
  }
  const examId = body.data.id
  console.log(`   Created exam "${body.data.name}" with ${body.data.classes.length} classes, ${body.data.subjects.length} subjects, ${body.data.schedule.length} schedule items, ${body.data.markSummary.total} mark rows`)

  // Step 4: Get the exam back
  res = await fetch(`${BASE}/api/exams/${examId}`, { headers })
  body = await res.json()
  console.log(`4. GET /api/exams/${examId} → HTTP ${res.status} | ${body?.data?.subjects?.length ?? 0} subjects, ${body?.data?.markSummary?.total ?? 0} mark rows`)

  // Step 5: Get students + marks for first subject
  const firstSubject = body.data.subjects[0]
  res = await fetch(`${BASE}/api/exams/${examId}/marks?classId=${targetClass.id}&subjectId=${firstSubject.subjectId}`, { headers })
  body = await res.json()
  console.log(`5. GET /api/exams/[id]/marks → HTTP ${res.status} | ${body?.data?.students?.length ?? 0} students, ${body?.data?.marks?.length ?? 0} marks`)
  if (body?.data?.students?.length) {
    console.log(`   First 3 students: ${body.data.students.slice(0, 3).map((s: any) => `${s.name} (${s.rollNo})`).join(', ')}`)
  }

  // Step 6: Enter marks for first 3 students
  const students: any[] = body.data.students
  for (let i = 0; i < Math.min(3, students.length); i++) {
    const s = students[i]
    res = await fetch(`${BASE}/api/exams/${examId}/marks/single`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        classId: targetClass.id,
        subjectId: firstSubject.subjectId,
        studentId: s.id,
        marksObtained: 35 + i * 5,
        status: 'PRESENT',
      }),
    })
    const m = await res.json()
    console.log(`6.${i+1}. Set mark for ${s.name} = ${35 + i * 5} → HTTP ${res.status}`)
  }

  // Mark 4th student as absent
  if (students.length > 3) {
    res = await fetch(`${BASE}/api/exams/${examId}/marks/single`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        classId: targetClass.id,
        subjectId: firstSubject.subjectId,
        studentId: students[3].id,
        marksObtained: null,
        status: 'ABSENT',
      }),
    })
    console.log(`6.4. Set ${students[3].name} ABSENT → HTTP ${res.status}`)
  }

  // Enter marks for all remaining students + remaining subjects so we can lock
  console.log('   Entering marks for all remaining students × subjects...')
  for (const subject of body.data.subjects || []) {
    // re-fetch students list since we already have it cached above
    const allStudents = students
    for (const s of allStudents) {
      // skip students already entered for firstSubject
      if (subject.subjectId === firstSubject.subjectId && allStudents.indexOf(s) < 4) continue
      const mark = 30 + Math.floor(Math.random() * 20)
      res = await fetch(`${BASE}/api/exams/${examId}/marks/single`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          classId: targetClass.id,
          subjectId: subject.subjectId,
          studentId: s.id,
          marksObtained: mark,
          status: 'PRESENT',
        }),
      })
    }
  }
  console.log('   All marks entered.')

  // Step 7: Submit marks
  res = await fetch(`${BASE}/api/exams/${examId}/marks/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ classId: targetClass.id }),
  })
  body = await res.json()
  console.log(`7. POST /marks/submit → HTTP ${res.status} | submitted=${body?.data?.submitted}`)

  // Step 8: Verify marks
  res = await fetch(`${BASE}/api/exams/${examId}/marks/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ classId: targetClass.id }),
  })
  body = await res.json()
  console.log(`8. POST /marks/verify → HTTP ${res.status} | verified=${body?.data?.verified}`)

  // Step 9: Lock marks
  res = await fetch(`${BASE}/api/exams/${examId}/marks/lock`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ classId: targetClass.id }),
  })
  body = await res.json()
  console.log(`9. POST /marks/lock → HTTP ${res.status} | locked=${body?.data?.locked}`)

  // Step 10: Get results
  res = await fetch(`${BASE}/api/exams/${examId}/results/class/${targetClass.id}`, { headers })
  body = await res.json()
  console.log(`10. GET /results/class/${targetClass.id} → HTTP ${res.status}`)
  if (body?.data?.results?.length) {
    console.log(`   Total students: ${body.data.analytics.totalStudents}`)
    console.log(`   Passed: ${body.data.analytics.passed} | Failed: ${body.data.analytics.failed} | Pass %: ${body.data.analytics.passRate}`)
    console.log(`   Avg: ${body.data.analytics.averagePercentage}% | Topper: ${body.data.analytics.toppers[0]?.name} (${body.data.analytics.toppers[0]?.percentage}%)`)
    console.log(`   Grade dist: ${JSON.stringify(body.data.analytics.gradeDistribution)}`)
  } else {
    console.log('   ERROR:', JSON.stringify(body))
  }

  // Step 11: Declare results
  res = await fetch(`${BASE}/api/exams/${examId}/results/declare`, {
    method: 'POST',
    headers,
    body: '{}',
  })
  body = await res.json()
  console.log(`11. POST /results/declare → HTTP ${res.status} | declared=${body?.data?.declared}`)

  // Step 12: Refresh — list exams again to confirm persistence
  res = await fetch(`${BASE}/api/exams`, { headers })
  body = await res.json()
  const found = body?.data?.exams?.find((e: any) => e.id === examId)
  console.log(`12. After refresh — exam persists: ${!!found}`)
  if (found) {
    console.log(`   Result status: ${found.resultStatus} | Exam status: ${found.status}`)
  }

  // Audit log check
  res = await fetch(`${BASE}/api/exams/${examId}/audit`, { headers })
  body = await res.json()
  console.log(`13. Audit logs: ${body?.data?.length ?? 0} entries`)
  if (body?.data?.length) {
    console.log('   Sample actions:', body.data.slice(0, 5).map((l: any) => l.action).join(', '))
  }

  console.log('\n=== END-TO-END TEST COMPLETE ===')
  console.log(`Exam ID: ${examId}`)
  console.log('You can now login as principal@greenwood.edu.in / principal123 and verify this exam appears in the UI.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => await db.$disconnect())
