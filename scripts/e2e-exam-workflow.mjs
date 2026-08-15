// E2E test of the exam workflow via HTTP API.
// Tests: school-context → list exams → create exam → add schedule → set mark →
//        compute outcomes → declare → apply grace → delete

const BASE = 'http://localhost:3000'

async function main() {
  console.log('=== EXAM WORKFLOW E2E (HTTP) ===')

  // 1. Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'principal@greenwood.edu.in', password: 'principal123' }),
  })
  const cookie = loginRes.headers.get('set-cookie') ?? ''
  const authCookie = cookie.split(';')[0]
  console.log('1. Login:', loginRes.status === 200 ? '✓' : '✗')

  const headers = { Cookie: authCookie, 'Content-Type': 'application/json' }

  // 2. School context
  const scRes = await fetch(`${BASE}/api/exams/school-context`, { headers: { Cookie: authCookie } })
  const sc = await scRes.json()
  console.log(`2. School context: ${sc.data?.schoolName} (${sc.data?.board})`)

  // 3. List exams + classes
  const listRes = await fetch(`${BASE}/api/exams`, { headers: { Cookie: authCookie } })
  const list = await listRes.json()
  console.log(`3. Exams: ${list.data.exams.length}, Classes: ${list.data.classes.length}`)
  const cls = list.data.classes[0]
  const subj = cls.subjects[0]
  console.log(`   Using class: ${cls.name} (${cls.studentCount} students, ${cls.subjects.length} subjects)`)
  console.log(`   Using subject: ${subj.name} (id: ${subj.id})`)

  // 4. Create exam
  const createRes = await fetch(`${BASE}/api/exams`, {
    method: 'POST', headers,
    body: JSON.stringify({
      name: 'E2E Test Exam',
      type: 'Unit Test',
      session: '2025-2026',
      startDate: '2026-03-15',
      endDate: '2026-03-20',
      passPercentage: 33,
      classIds: [cls.id],
      subjectsByClass: {
        [cls.id]: cls.subjects.slice(0, 3).map(s => ({
          subjectId: s.id, maxMarks: 100, passMarks: 33, theoryMarks: 100, practicalMarks: 0,
        })),
      },
      schedule: [],
    }),
  })
  const created = await createRes.json()
  if (!created.ok) {
    console.log('4. Create exam FAILED:', created.error)
    return
  }
  const exam = created.data
  console.log(`4. Created exam: ${exam.name} | status=${exam.status} | resultStatus=${exam.resultStatus}`)
  console.log(`   Classes: ${exam.classes.length}, Subjects: ${exam.subjects.length}, Marks rows: ${exam.markSummary.total}`)

  // 5. Add schedule item (should auto-transition Draft → Scheduled)
  const schedRes = await fetch(`${BASE}/api/exams/${exam.id}/schedule`, {
    method: 'POST', headers,
    body: JSON.stringify({
      classId: cls.id, subjectId: subj.id,
      date: '2026-03-15', startTime: '09:00', endTime: '12:00',
      room: 'Room A', invigilatorName: 'Test Teacher',
    }),
  })
  const sched = await schedRes.json()
  console.log(`5. Schedule added: ${sched.ok ? '✓' : '✗ ' + sched.error}`)
  if (sched.ok) {
    const examAfter = await fetch(`${BASE}/api/exams/${exam.id}`, { headers: { Cookie: authCookie } }).then(r => r.json())
    console.log(`   Status after schedule: ${examAfter.data.status} (expected Scheduled)`)
  }

  // 6. Try conflicting schedule (should fail)
  const conflictRes = await fetch(`${BASE}/api/exams/${exam.id}/schedule`, {
    method: 'POST', headers,
    body: JSON.stringify({
      classId: cls.id, subjectId: cls.subjects[1].id,
      date: '2026-03-15', startTime: '10:00', endTime: '13:00',
      room: 'Room A',
    }),
  })
  const conflict = await conflictRes.json()
  console.log(`6. Conflict detection: ${!conflict.ok ? '✓ (' + conflict.error + ')' : '✗ conflict not detected'}`)

  // 7. Get classes' students for marks entry
  const studentsRes = await fetch(`${BASE}/api/exams/${exam.id}/marks?classId=${cls.id}&subjectId=${subj.id}`, { headers: { Cookie: authCookie } })
  const studentsData = await studentsRes.json()
  const marksRows = studentsData.ok ? (studentsData.data.marks ?? []) : []
  console.log(`7. Marks fetched: ${studentsData.ok ? marksRows.length + ' rows' : '✗ ' + studentsData.error}`)

  // 8. Set mark (should auto-transition Scheduled → Ongoing)
  if (marksRows.length > 0) {
    const markRow = marksRows[0]
    const setMarkRes = await fetch(`${BASE}/api/exams/${exam.id}/marks/single`, {
      method: 'POST', headers,
      body: JSON.stringify({
        classId: cls.id, subjectId: subj.id, studentId: markRow.studentId,
        marksObtained: 75, status: 'PRESENT',
      }),
    })
    const setMark = await setMarkRes.json()
    console.log(`8. Set mark: ${setMark.ok ? '✓ (' + setMark.data.marksObtained + '/100)' : '✗ ' + setMark.error}`)
    if (setMark.ok) {
      const examAfter = await fetch(`${BASE}/api/exams/${exam.id}`, { headers: { Cookie: authCookie } }).then(r => r.json())
      console.log(`   Status after mark: ${examAfter.data.status} (expected Ongoing)`)
    }
  }

  // 9. Try mark > max (should fail)
  if (marksRows.length > 0) {
    const markRow = marksRows[0]
    const overMaxRes = await fetch(`${BASE}/api/exams/${exam.id}/marks/single`, {
      method: 'POST', headers,
      body: JSON.stringify({
        classId: cls.id, subjectId: subj.id, studentId: markRow.studentId,
        marksObtained: 150, status: 'PRESENT',
      }),
    })
    const overMax = await overMaxRes.json()
    console.log(`9. Mark > max rejected: ${!overMax.ok ? '✓ (' + overMax.error + ')' : '✗ not rejected'}`)
  }

  // 10. Results + analytics (tests GradeScale wiring)
  const resultsRes = await fetch(`${BASE}/api/exams/${exam.id}/results/class/${cls.id}`, { headers: { Cookie: authCookie } })
  const resultsData = await resultsRes.json()
  if (resultsData.ok) {
    console.log(`10. Results computed: ${resultsData.data.results.length} students`)
    console.log(`    Analytics: passRate=${resultsData.data.analytics.passRate}%, avg=${resultsData.data.analytics.averagePercentage}%`)
    if (resultsData.data.results.length > 0) {
      const r = resultsData.data.results[0]
      console.log(`    Top: ${r.studentName} = ${r.percentage}% (grade=${r.grade})`)
    }
  } else {
    console.log(`10. Results: ✗ ${resultsData.error}`)
  }

  // 11. Generate seating plan
  const seatingRes = await fetch(`${BASE}/api/exams/${exam.id}/seating/generate`, {
    method: 'POST', headers,
    body: JSON.stringify({ classId: cls.id, rooms: [{ name: 'Room A', capacity: 30 }] }),
  })
  const seating = await seatingRes.json()
  console.log(`11. Seating generated: ${seating.ok ? seating.data.generated + ' seats' : '✗ ' + seating.error}`)

  // 12. Auto-mark attendance
  const attRes = await fetch(`${BASE}/api/exams/${exam.id}/attendance/auto`, {
    method: 'POST', headers,
    body: JSON.stringify({ classId: cls.id }),
  })
  const att = await attRes.json()
  console.log(`12. Auto attendance: ${att.ok ? att.data.marked + ' marked' : '✗ ' + att.error}`)

  // 13. Compute auto outcomes (reads ExamRule thresholds)
  const outcomesRes = await fetch(`${BASE}/api/exams/${exam.id}/outcomes/compute`, {
    method: 'POST', headers,
    body: JSON.stringify({ classId: cls.id }),
  })
  const outcomes = await outcomesRes.json()
  console.log(`13. Auto outcomes: ${outcomes.ok ? outcomes.data.autoCount + ' computed' : '✗ ' + outcomes.error}`)

  // 14. Try grace marks (should enforce graceMarksLimit=5 from ExamRule)
  if (marksRows.length > 0) {
    const mark = marksRows[0]
    const graceRes = await fetch(`${BASE}/api/exams/${exam.id}/grace`, {
      method: 'POST', headers,
      body: JSON.stringify({ markId: mark.id, graceMarks: 10, reason: 'Test grace exceeds limit' }),
    })
    const grace = await graceRes.json()
    console.log(`14. Grace limit enforced: ${!grace.ok ? '✓ (' + grace.error + ')' : '✗ grace of 10 was accepted (limit=5)'}`)
  }

  // 15. Audit log
  const auditRes = await fetch(`${BASE}/api/exams/${exam.id}/audit`, { headers: { Cookie: authCookie } })
  const audit = await auditRes.json()
  console.log(`15. Audit logs: ${audit.ok ? audit.data.length + ' entries' : '✗ ' + audit.error}`)
  if (audit.ok && audit.data.length > 0) {
    console.log(`    First: ${audit.data[0].action} at ${audit.data[0].createdAt}`)
  }

  // 16. Clean up — delete the test exam
  const delRes = await fetch(`${BASE}/api/exams/${exam.id}`, { method: 'DELETE', headers })
  const del = await delRes.json()
  console.log(`16. Cleanup (delete exam): ${del.ok ? '✓' : '✗ ' + del.error}`)

  console.log('\n=== E2E TEST COMPLETE ===')
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
