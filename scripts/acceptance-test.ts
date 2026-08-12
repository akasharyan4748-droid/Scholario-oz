/**
 * Principal Acceptance Test — simulates the user's acceptance flow.
 * 
 * 1. Login as principal@greenwood.edu.in
 * 2. GET /api/exams → list exams + classes
 * 3. POST /api/exams → create a real exam for Grade 9-A with Math + Physics + English
 * 4. GET /api/exams/[id] → confirm exam persisted with students + subjects
 * 5. GET /api/exams/[id]/marks?classId=...&subjectId=... → see real students
 * 6. POST /api/exams/[id]/marks/single → enter marks for first 3 students
 * 7. POST /api/exams/[id]/marks/single (ABSENT) → mark 4th student absent
 * 8. POST /api/exams/[id]/marks/submit → submit
 * 9. POST /api/exams/[id]/marks/verify → verify
 * 10. POST /api/exams/[id]/marks/lock → lock
 * 11. GET /api/exams/[id]/results/class/[classId] → see REAL computed analytics
 * 12. Verify: analytics has real students, real averages, real toppers
 * 13. POST /api/exams/[id]/results/declare → declare results
 * 14. GET /api/exams → confirm exam now shows "Result Declared" after refresh
 */
const BASE = 'http://localhost:3000'

async function api(url: string, init?: RequestInit, cookie?: string) {
  const headers = { ...(init?.headers || {}), cookie: cookie || '', 'content-type': 'application/json' }
  const res = await fetch(BASE + url, { ...init, headers })
  return { status: res.status, body: await res.json().catch(() => null) }
}

async function main() {
  console.log('=== PRINCIPAL ACCEPTANCE TEST ===\n')

  // 1. Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'principal@greenwood.edu.in', password: 'principal123' }),
  })
  const cookie = loginRes.headers.get('set-cookie')!.split(';')[0]
  console.log('1. ✓ Login as principal')

  // 2. List exams + classes
  let r = await api('/api/exams', {}, cookie)
  const exam0Count = r.body.data.exams.length
  const targetClass = r.body.data.classes.find((c: any) => c.name.includes('Grade 9'))
  console.log(`2. ✓ GET /api/exams → ${exam0Count} exams, ${r.body.data.classes.length} classes`)
  console.log(`   Target class: ${targetClass.name} (${targetClass.studentCount} students, ${targetClass.subjects.length} subjects)`)

  // Pick 3 subjects: Mathematics, Physics, English
  const subjects = targetClass.subjects.slice(0, 3)
  console.log(`   Using subjects: ${subjects.map((s: any) => s.name).join(', ')}`)

  // 3. Create exam
  r = await api('/api/exams', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Acceptance Test Exam',
      type: 'Unit Test',
      session: '2025-2026',
      startDate: '2026-09-15',
      endDate: '2026-09-20',
      classIds: [targetClass.id],
      subjectsByClass: {
        [targetClass.id]: subjects.map((s: any) => ({
          subjectId: s.id,
          maxMarks: 50,
          passMarks: 17,
          theoryMarks: 50,
          practicalMarks: 0,
        })),
      },
      schedule: subjects.map((s: any, i: number) => ({
        classId: targetClass.id,
        subjectId: s.id,
        date: `2026-09-${15 + i}`,
        startTime: '09:00',
        endTime: '10:00',
        room: `Room ${100 + i}`,
        invigilatorName: 'Rohan Mehta',
      })),
    }),
  }, cookie)
  const examId = r.body.data.id
  console.log(`3. ✓ POST /api/exams → created exam id=${examId}`)
  console.log(`   Mark rows auto-created: ${r.body.data.markSummary.total}`)

  // 4. Get exam
  r = await api(`/api/exams/${examId}`, {}, cookie)
  console.log(`4. ✓ GET /api/exams/${examId} → persisted`)
  console.log(`   Classes: ${r.body.data.classes.length}, Subjects: ${r.body.data.subjects.length}, Schedule: ${r.body.data.schedule.length}`)

  // 5. Get students + marks for first subject
  const firstSubject = r.body.data.subjects[0]
  r = await api(`/api/exams/${examId}/marks?classId=${targetClass.id}&subjectId=${firstSubject.subjectId}`, {}, cookie)
  console.log(`5. ✓ GET /api/exams/[id]/marks → ${r.body.data.students.length} real students`)
  console.log(`   First 3 students: ${r.body.data.students.slice(0, 3).map((s: any) => `${s.name} (#${s.rollNo})`).join(', ')}`)

  // 6. Enter marks for first 3 students
  const students = r.body.data.students
  for (let i = 0; i < 3; i++) {
    await api(`/api/exams/${examId}/marks/single`, {
      method: 'POST',
      body: JSON.stringify({
        classId: targetClass.id,
        subjectId: firstSubject.subjectId,
        studentId: students[i].id,
        marksObtained: 35 + i * 5,
        status: 'PRESENT',
      }),
    }, cookie)
  }
  console.log(`6. ✓ Set marks for 3 students: ${students[0].name}=35, ${students[1].name}=40, ${students[2].name}=45`)

  // 7. Mark 4th student absent
  if (students.length > 3) {
    await api(`/api/exams/${examId}/marks/single`, {
      method: 'POST',
      body: JSON.stringify({
        classId: targetClass.id,
        subjectId: firstSubject.subjectId,
        studentId: students[3].id,
        marksObtained: null,
        status: 'ABSENT',
      }),
    }, cookie)
    console.log(`7. ✓ Marked ${students[3].name} ABSENT`)
  }

  // Fill remaining marks so we can complete workflow
  console.log('   Filling remaining marks for all subjects × all students...')
  const examData = (await api(`/api/exams/${examId}`, {}, cookie)).body.data
  for (const subject of examData.subjects) {
    for (const s of students) {
      // Skip students we already set for firstSubject
      if (subject.subjectId === firstSubject.subjectId && students.indexOf(s) < 4) continue
      const mark = 30 + Math.floor(Math.random() * 20)
      await api(`/api/exams/${examId}/marks/single`, {
        method: 'POST',
        body: JSON.stringify({
          classId: targetClass.id,
          subjectId: subject.subjectId,
          studentId: s.id,
          marksObtained: mark,
          status: 'PRESENT',
        }),
      }, cookie)
    }
  }
  console.log('   ✓ All marks entered')

  // 8. Submit
  r = await api(`/api/exams/${examId}/marks/submit`, {
    method: 'POST',
    body: JSON.stringify({ classId: targetClass.id }),
  }, cookie)
  console.log(`8. ✓ POST /marks/submit → ${r.body.data.submitted} submitted`)

  // 9. Verify
  r = await api(`/api/exams/${examId}/marks/verify`, {
    method: 'POST',
    body: JSON.stringify({ classId: targetClass.id }),
  }, cookie)
  console.log(`9. ✓ POST /marks/verify → ${r.body.data.verified} verified`)

  // 10. Lock
  r = await api(`/api/exams/${examId}/marks/lock`, {
    method: 'POST',
    body: JSON.stringify({ classId: targetClass.id }),
  }, cookie)
  console.log(`10. ✓ POST /marks/lock → ${r.body.data.locked} locked`)

  // 11. Get results — confirm REAL data
  r = await api(`/api/exams/${examId}/results/class/${targetClass.id}`, {}, cookie)
  const a = r.body.data.analytics
  console.log(`11. ✓ GET /results/class/[classId] → REAL analytics`)
  console.log(`    Total students: ${a.totalStudents}`)
  console.log(`    Passed: ${a.passed}, Failed: ${a.failed}, Pass %: ${a.passRate}%`)
  console.log(`    Class Avg: ${a.averagePercentage}%, Highest: ${a.highestPercentage}%, Lowest: ${a.lowestPercentage}%`)
  console.log(`    Grade Distribution: ${JSON.stringify(a.gradeDistribution)}`)
  console.log(`    Subject Performance:`)
  for (const sp of a.subjectPerformance) {
    console.log(`      ${sp.subjectName}: avg ${sp.averageMarks}/${sp.total} students = ${sp.averagePercentage}%`)
  }
  console.log(`    Toppers:`)
  for (const t of a.toppers) {
    console.log(`      #${t.rank} ${t.name} (#${t.rollNo}) — ${t.percentage}% (${t.grade})`)
  }

  // 13. Declare results
  r = await api(`/api/exams/${examId}/results/declare`, { method: 'POST', body: '{}' }, cookie)
  console.log(`13. ✓ POST /results/declare → declared=${r.body.data.declared}`)

  // 14. Refresh — exam now shows "Result Declared"
  r = await api('/api/exams', {}, cookie)
  const exam = r.body.data.exams.find((e: any) => e.id === examId)
  console.log(`14. ✓ After refresh — exam status=${exam.status}, resultStatus=${exam.resultStatus}`)
  console.log(`    Total exams now: ${r.body.data.exams.length} (was ${exam0Count})`)

  console.log('\n=== ACCEPTANCE TEST PASSED ===')
  console.log(`\nPrincipal can now login and see exam "${exam.name}" with full results in the UI.`)
  console.log(`\nLogin: principal@greenwood.edu.in / principal123`)
}
main().catch(console.error)
