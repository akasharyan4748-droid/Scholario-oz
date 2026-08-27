// Add Class 11-12 stream-aware classes + subjects to the existing demo school.
// No schema changes — uses existing Class.stream + Subject models.
// Run with: ./node_modules/.bin/tsx scripts/add-senior-classes.ts

import { db } from '../../src/lib/db'

async function main() {
  console.log('🌱 Adding Class 11-12 stream-aware classes...')

  const school = await db.school.findFirst({ where: { isDemo: true } })
  if (!school) {
    console.log('No demo school found — aborting.')
    return
  }

  // Look up an existing teacher for classTeacher assignment
  const teacher = await db.teacher.findFirst({ where: { schoolId: school.id } })

  // ─── Class 11 — Science PCM ────────────────────────────────────
  const cls11PCM = await db.class.create({
    data: {
      schoolId: school.id,
      name: 'Grade 11 - Science PCM',
      gradeLevel: '11',
      section: 'A',
      stream: 'Science-PCM',
      capacity: 40,
      room: '301',
      classTeacherId: teacher?.id,
    },
  })
  for (const subj of [
    { name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33 },
    { name: 'Physics', code: 'PHY', fullMarks: 100, passMarks: 33 },
    { name: 'Chemistry', code: 'CHE', fullMarks: 100, passMarks: 33 },
    { name: 'Mathematics', code: 'MAT', fullMarks: 100, passMarks: 33 },
    { name: 'Physical Education', code: 'PED', fullMarks: 100, passMarks: 33 },
  ]) {
    await db.subject.create({ data: { schoolId: school.id, classId: cls11PCM.id, ...subj } })
  }
  console.log(`  ✓ ${cls11PCM.name} (stream=Science-PCM, 5 subjects)`)

  // ─── Class 11 — Science PCB ────────────────────────────────────
  const cls11PCB = await db.class.create({
    data: {
      schoolId: school.id,
      name: 'Grade 11 - Science PCB',
      gradeLevel: '11',
      section: 'B',
      stream: 'Science-PCB',
      capacity: 40,
      room: '302',
      classTeacherId: teacher?.id,
    },
  })
  for (const subj of [
    { name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33 },
    { name: 'Physics', code: 'PHY', fullMarks: 100, passMarks: 33 },
    { name: 'Chemistry', code: 'CHE', fullMarks: 100, passMarks: 33 },
    { name: 'Biology', code: 'BIO', fullMarks: 100, passMarks: 33 },
    { name: 'Physical Education', code: 'PED', fullMarks: 100, passMarks: 33 },
  ]) {
    await db.subject.create({ data: { schoolId: school.id, classId: cls11PCB.id, ...subj } })
  }
  console.log(`  ✓ ${cls11PCB.name} (stream=Science-PCB, 5 subjects)`)

  // ─── Class 11 — Commerce ───────────────────────────────────────
  const cls11Com = await db.class.create({
    data: {
      schoolId: school.id,
      name: 'Grade 11 - Commerce',
      gradeLevel: '11',
      section: 'C',
      stream: 'Commerce',
      capacity: 40,
      room: '303',
      classTeacherId: teacher?.id,
    },
  })
  for (const subj of [
    { name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33 },
    { name: 'Accountancy', code: 'ACC', fullMarks: 100, passMarks: 33 },
    { name: 'Business Studies', code: 'BST', fullMarks: 100, passMarks: 33 },
    { name: 'Economics', code: 'ECO', fullMarks: 100, passMarks: 33 },
    { name: 'Mathematics', code: 'MAT', fullMarks: 100, passMarks: 33 },
  ]) {
    await db.subject.create({ data: { schoolId: school.id, classId: cls11Com.id, ...subj } })
  }
  console.log(`  ✓ ${cls11Com.name} (stream=Commerce, 5 subjects)`)

  // ─── Class 11 — Humanities ────────────────────────────────────
  const cls11Hum = await db.class.create({
    data: {
      schoolId: school.id,
      name: 'Grade 11 - Humanities',
      gradeLevel: '11',
      section: 'D',
      stream: 'Humanities',
      capacity: 40,
      room: '304',
      classTeacherId: teacher?.id,
    },
  })
  for (const subj of [
    { name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33 },
    { name: 'History', code: 'HIS', fullMarks: 100, passMarks: 33 },
    { name: 'Political Science', code: 'POL', fullMarks: 100, passMarks: 33 },
    { name: 'Geography', code: 'GEO', fullMarks: 100, passMarks: 33 },
    { name: 'Economics', code: 'ECO', fullMarks: 100, passMarks: 33 },
  ]) {
    await db.subject.create({ data: { schoolId: school.id, classId: cls11Hum.id, ...subj } })
  }
  console.log(`  ✓ ${cls11Hum.name} (stream=Humanities, 5 subjects)`)

  // ─── Class 12 — Science PCM ────────────────────────────────────
  const cls12PCM = await db.class.create({
    data: {
      schoolId: school.id,
      name: 'Grade 12 - Science PCM',
      gradeLevel: '12',
      section: 'A',
      stream: 'Science-PCM',
      capacity: 40,
      room: '401',
      classTeacherId: teacher?.id,
    },
  })
  for (const subj of [
    { name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33 },
    { name: 'Physics', code: 'PHY', fullMarks: 100, passMarks: 33 },
    { name: 'Chemistry', code: 'CHE', fullMarks: 100, passMarks: 33 },
    { name: 'Mathematics', code: 'MAT', fullMarks: 100, passMarks: 33 },
    { name: 'Physical Education', code: 'PED', fullMarks: 100, passMarks: 33 },
  ]) {
    await db.subject.create({ data: { schoolId: school.id, classId: cls12PCM.id, ...subj } })
  }
  console.log(`  ✓ ${cls12PCM.name} (stream=Science-PCM, 5 subjects)`)

  // ─── Class 12 — Commerce ───────────────────────────────────────
  const cls12Com = await db.class.create({
    data: {
      schoolId: school.id,
      name: 'Grade 12 - Commerce',
      gradeLevel: '12',
      section: 'C',
      stream: 'Commerce',
      capacity: 40,
      room: '403',
      classTeacherId: teacher?.id,
    },
  })
  for (const subj of [
    { name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33 },
    { name: 'Accountancy', code: 'ACC', fullMarks: 100, passMarks: 33 },
    { name: 'Business Studies', code: 'BST', fullMarks: 100, passMarks: 33 },
    { name: 'Economics', code: 'ECO', fullMarks: 100, passMarks: 33 },
    { name: 'Mathematics', code: 'MAT', fullMarks: 100, passMarks: 33 },
  ]) {
    await db.subject.create({ data: { schoolId: school.id, classId: cls12Com.id, ...subj } })
  }
  console.log(`  ✓ ${cls12Com.name} (stream=Commerce, 5 subjects)`)

  console.log('\n✓ Senior classes added. Total classes now:')
  const allClasses = await db.class.findMany({
    where: { schoolId: school.id },
    orderBy: [{ gradeLevel: 'asc' }, { section: 'asc' }],
    include: { _count: { select: { subjects: true } } },
  })
  allClasses.forEach(c => console.log(`  - ${c.name}  grade=${c.gradeLevel}  stream=${c.stream ?? 'null'}  subjects=${c._count.subjects}`))

  await db.$disconnect()
}

main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
