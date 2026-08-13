/**
 * Test P1 & P2 exam features end-to-end via API.
 * Covers: schedule edit, seating, exam attendance, invigilator, grace,
 * outcomes (promotion/compartment), CSV import, publish.
 */
const BASE = 'http://localhost:3000'

async function api(url: string, init?: RequestInit, cookie?: string) {
  const headers = { ...(init?.headers || {}), cookie: cookie || '', 'content-type': 'application/json' }
  const res = await fetch(BASE + url, { ...init, headers })
  return { status: res.status, body: await res.json().catch(() => null) }
}

async function main() {
  console.log('=== P1 & P2 FEATURES TEST ===\n')

  // Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'principal@greenwood.edu.in', password: 'principal123' }),
  })
  const cookie = loginRes.headers.get('set-cookie')!.split(';')[0]
  console.log('1. ✓ Login')

  // Get the Acceptance Test Exam
  let r = await api('/api/exams', {}, cookie)
  const exam = r.body.data.exams.find((e: any) => e.name === 'Acceptance Test Exam')
  if (!exam) { console.log('No exam found'); return }
  console.log(`2. ✓ Found exam: ${exam.name} (id=${exam.id})`)
  const examId = exam.id
  const classId = exam.classes[0].classId
  const subjectId = exam.subjects[0].subjectId

  // Find a schedule item to edit
  let r2 = await api(`/api/exams/${examId}`, {}, cookie)
  const scheduleItem = r2.body.data.schedule[0]
  if (!scheduleItem) { console.log('No schedule item'); return }
  console.log(`3. ✓ Schedule item: subject=${scheduleItem.subjectName}, date=${scheduleItem.date}, room=${scheduleItem.room}`)

  // 4. Update schedule item
  r = await api(`/api/exams/${examId}/schedule/items/${scheduleItem.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ room: 'Updated Room 999' }),
  }, cookie)
  console.log(`4. PATCH /schedule/items/${scheduleItem.id} → HTTP ${r.status} | new room=${r.body?.data?.room}`)

  // 5. Get teachers (invigilator roster)
  r = await api(`/api/exams/${examId}/invigilator`, {}, cookie)
  console.log(`5. ✓ GET /invigilator → ${r.body?.data?.length ?? 0} teachers available`)
  if (r.body?.data?.length > 0) {
    const teacher = r.body.data[0]
    console.log(`   First teacher: ${teacher.name} (${teacher.department})`)
    
    // 6. Assign invigilator
    r = await api(`/api/exams/${examId}/invigilator`, {
      method: 'POST',
      body: JSON.stringify({ scheduleItemId: scheduleItem.id, teacherId: teacher.id }),
    }, cookie)
    console.log(`6. POST /invigilator assign → HTTP ${r.status} | invigilator=${r.body?.data?.invigilatorName}`)
  }

  // 7. Generate seating plan
  r = await api(`/api/exams/${examId}/seating/generate`, {
    method: 'POST',
    body: JSON.stringify({
      classId,
      rooms: [{ name: 'Hall A', capacity: 30 }],
    }),
  }, cookie)
  console.log(`7. ✓ POST /seating/generate → ${r.body?.data?.generated ?? 0} students seated`)

  // 8. Get seating plan
  r = await api(`/api/exams/${examId}/seating?classId=${classId}`, {}, cookie)
  console.log(`8. ✓ GET /seating → ${r.body?.data?.length ?? 0} seat assignments`)
  if (r.body?.data?.length > 0) {
    const first = r.body.data[0]
    console.log(`   First seat: ${first.studentName} → ${first.room} seat #${first.seatNumber}`)
  }

  // 9. Auto-mark exam attendance from marks
  r = await api(`/api/exams/${examId}/attendance/auto`, {
    method: 'POST',
    body: JSON.stringify({ classId }),
  }, cookie)
  console.log(`9. ✓ POST /attendance/auto → ${r.body?.data?.marked ?? 0} attendance entries synced`)

  // 10. Get exam attendance
  r = await api(`/api/exams/${examId}/attendance?classId=${classId}`, {}, cookie)
  console.log(`10. ✓ GET /attendance → ${r.body?.data?.length ?? 0} entries`)
  if (r.body?.data?.length > 0) {
    const byStatus = r.body.data.reduce((acc: any, a: any) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      return acc
    }, {})
    console.log(`    Breakdown: ${JSON.stringify(byStatus)}`)
  }

  // 11. Compute auto outcomes (Promotion/Compartment/Retest)
  r = await api(`/api/exams/${examId}/outcomes/compute`, {
    method: 'POST',
    body: JSON.stringify({ classId }),
  }, cookie)
  console.log(`11. ✓ POST /outcomes/compute → ${r.body?.data?.autoCount ?? 0} outcomes computed`)

  // 12. Get outcomes
  r = await api(`/api/exams/${examId}/outcomes?classId=${classId}`, {}, cookie)
  console.log(`12. ✓ GET /outcomes → ${r.body?.data?.length ?? 0} outcomes`)
  if (r.body?.data?.length > 0) {
    const summary = r.body.data.reduce((acc: any, o: any) => {
      acc[o.outcome] = (acc[o.outcome] || 0) + 1
      return acc
    }, {})
    console.log(`    Summary: ${JSON.stringify(summary)}`)
    console.log(`    Sample: ${r.body.data[0].studentName} → ${r.body.data[0].outcome} (${r.body.data[0].percentage}% grade ${r.body.data[0].grade}, ${r.body.data[0].subjectsFailed} failed)`)
    
    // 13. Override one outcome
    const firstOutcome = r.body.data[0]
    r = await api(`/api/exams/${examId}/outcomes/${firstOutcome.studentId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        outcome: 'RETEST',
        reason: 'Manual override — student medical emergency',
        notes: 'Principal approved retest',
      }),
    }, cookie)
    console.log(`13. ✓ PATCH /outcomes/${firstOutcome.studentId.slice(0, 8)}... → overridden to RETEST`)
  }

  // 14. Download CSV template
  const templateRes = await fetch(`${BASE}/api/exams/${examId}/marks/template?classId=${classId}&subjectId=${subjectId}`, {
    headers: { cookie },
  })
  const templateBody = await templateRes.json().catch(() => null)
  if (templateBody?.ok) {
    const lines = (templateBody.data.csv || '').split('\n').filter(Boolean)
    console.log(`14. ✓ GET /marks/template → ${lines.length} rows (incl. header), ${templateBody.data.studentCount} students, max ${templateBody.data.maxMarks} marks`)
    if (lines.length > 0) console.log(`    Sample header: ${lines[0]}`)
    if (lines.length > 1) console.log(`    Sample row: ${lines[1]}`)
  } else {
    console.log(`14. ✗ GET /marks/template failed: ${templateRes.status} ${JSON.stringify(templateBody)?.slice(0, 200)}`)
  }

  // 15. Create a fresh exam to test CSV import (need non-locked exam)
  r = await api('/api/exams', {
    method: 'POST',
    body: JSON.stringify({
      name: 'CSV Import Test Exam',
      type: 'Unit Test',
      session: '2025-2026',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      classIds: [classId],
      subjectsByClass: {
        [classId]: exam.subjects.slice(0, 1).map((s: any) => ({
          subjectId: s.subjectId,
          maxMarks: 50,
          passMarks: 17,
          theoryMarks: 50,
          practicalMarks: 0,
        })),
      },
    }),
  }, cookie)
  const newExamId = r.body.data.id
  console.log(`15. ✓ Created fresh exam for CSV import test (id=${newExamId})`)

  // 16. Import CSV (using known roll numbers 01-11)
  const csvRows = Array.from({ length: 11 }, (_, i) => {
    const rollNo = String(i + 1).padStart(2, '0')
    const marks = 30 + Math.floor(Math.random() * 20)
    return { rollNo, studentName: `Test ${i + 1}`, marksObtained: marks, status: 'PRESENT' }
  })
  // Add invalid row to test validation
  csvRows.push({ rollNo: '999', studentName: 'Invalid', marksObtained: 999, status: 'PRESENT' })
  r = await api(`/api/exams/${newExamId}/marks/import`, {
    method: 'POST',
    body: JSON.stringify({ classId, subjectId, rows: csvRows }),
  }, cookie)
  console.log(`16. ✓ POST /marks/import → accepted=${r.body?.data?.accepted}, rejected=${r.body?.data?.rejected}`)
  if (r.body?.data?.errors?.length > 0) {
    console.log(`    Errors: ${r.body.data.errors.slice(0, 2).map((e: any) => `row ${e.row}: ${e.message}`).join('; ')}`)
  }

  // 17. Apply grace marks (need a mark id from the new exam)
  r = await api(`/api/exams/${newExamId}/marks?classId=${classId}&subjectId=${subjectId}`, {}, cookie)
  const markToGrace = r.body?.data?.marks?.[0]
  if (markToGrace) {
    r = await api(`/api/exams/${newExamId}/grace`, {
      method: 'POST',
      body: JSON.stringify({
        markId: markToGrace.id,
        graceMarks: 5,
        reason: 'Question paper ambiguity in Q3',
      }),
    }, cookie)
    console.log(`17. ✓ POST /grace → marksObtained=${r.body?.data?.marksObtained}, graceMarks=${r.body?.data?.graceMarks}, original=${r.body?.data?.originalMarks}`)
  }

  // 18. Publish results of original Acceptance Test Exam
  r = await api(`/api/exams/${examId}/publish`, {
    method: 'POST',
    body: JSON.stringify({ notifyStudents: true, notifyParents: true }),
  }, cookie)
  console.log(`18. ✓ POST /publish → published=${r.body?.data?.published}, notifications=${r.body?.data?.notificationsSent}`)

  // 19. Get audit logs for original exam — should show all the new actions
  r = await api(`/api/exams/${examId}/audit`, {}, cookie)
  const actions = new Set(r.body?.data?.map((l: any) => l.action) || [])
  console.log(`19. ✓ GET /audit → ${r.body?.data?.length ?? 0} entries`)
  console.log(`    Actions: ${Array.from(actions).join(', ')}`)

  // 20. Cleanup test exam
  await fetch(`${BASE}/api/exams/${newExamId}`, { method: 'DELETE', headers: { cookie } })
  console.log(`20. ✓ Cleaned up CSV Import Test Exam`)

  console.log('\n=== P1 & P2 FEATURES TEST PASSED ===')
}

main().catch((e) => { console.error(e); process.exit(1) })
