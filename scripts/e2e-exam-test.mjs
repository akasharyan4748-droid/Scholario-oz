import { db } from '../src/lib/db'

async function run() {
  console.log('=== EXAMS E2E VERIFICATION ===')
  const schools = await db.school.findMany({ select: { id: true, name: true, board: true } })
  console.log('Schools:', schools)
  const school = schools[0]

  const exams = await db.exam.findMany({ where: { schoolId: school.id }, select: { id: true, name: true, status: true, resultStatus: true, type: true, session: true } })
  console.log('Exams in DB:', exams.length)
  exams.forEach(e => console.log(`  - ${e.name} [${e.status} / ${e.resultStatus}] type=${e.type}`))

  const grades = await db.gradeScale.findMany({ where: { schoolId: school.id } })
  console.log('GradeScales:', grades.length, 'rows')
  grades.forEach(g => console.log(`  - ${g.grade}: ${g.minPct}-${g.maxPct}%`))

  const rules = await db.examRule.findMany({ where: { schoolId: school.id } })
  console.log('ExamRules:', rules.length, 'rows')
  console.log('  Sample rules:', rules.slice(0, 5).map(r => `${r.key}=${r.value}`).join(', '))

  const admitCfg = await db.admitCardConfig.findUnique({ where: { schoolId: school.id } })
  console.log('AdmitCardConfig:', admitCfg ? 'YES' : 'NO')

  const reportCfg = await db.reportCardConfig.findUnique({ where: { schoolId: school.id } })
  console.log('ReportCardConfig:', reportCfg ? 'YES' : 'NO')

  const types = await db.examTypeConfig.findMany({ where: { schoolId: school.id } })
  console.log('ExamTypes:', types.length, 'types')
  types.forEach(t => console.log(`  - ${t.name} (${t.code}) enabled=${t.enabled}`))

  const classes = await db.class.findMany({ where: { schoolId: school.id }, select: { id: true, name: true, gradeLevel: true, stream: true } })
  console.log('Classes:', classes.length)
  classes.forEach(c => console.log(`  - ${c.name} grade=${c.gradeLevel} stream=${c.stream ?? 'null'}`))

  const schedule = await db.examScheduleItem.findFirst({ where: { school: { id: school.id } }, include: { subject: true } })
  console.log('ScheduleItem sample:', schedule ? `subject=${schedule.subject?.name}, subjectId=${schedule.subjectId}` : 'none')

  await db.$disconnect()
}
run().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
