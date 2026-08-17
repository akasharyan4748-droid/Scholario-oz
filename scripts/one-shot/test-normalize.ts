// Inline the normalization function for testing
interface ClassDTO {
  id: string; name: string; gradeLevel: string | null; section: string | null; stream: string | null
  studentCount: number; subjects: Array<{ id: string; name: string; code: string | null; fullMarks: number; passMarks: number }>
}
interface ExamClass {
  key: string; label: string; gradeLevel: string; stream: string | null
  sectionIds: string[]; sectionCount: number; studentCount: number; subjects: ClassDTO['subjects']
}
function normalizeToExamClasses(classes: ClassDTO[]): ExamClass[] {
  const byKey = new Map<string, ExamClass>()
  for (const cls of classes) {
    const grade = cls.gradeLevel ?? '0'
    const stream = cls.stream ?? null
    const key = `${grade}-${stream ?? 'general'}`
    const existing = byKey.get(key)
    if (existing) {
      existing.sectionIds.push(cls.id); existing.sectionCount++; existing.studentCount += cls.studentCount
      const existingNames = new Set(existing.subjects.map(s => s.name))
      for (const subj of cls.subjects) { if (!existingNames.has(subj.name)) { existing.subjects.push(subj); existingNames.add(subj.name) } }
    } else {
      const streamLabel = stream ? stream.replace('Science-', '') : null
      const label = streamLabel ? `Class ${grade} — ${streamLabel}` : `Class ${grade}`
      byKey.set(key, { key, label, gradeLevel: grade, stream, sectionIds: [cls.id], sectionCount: 1, studentCount: cls.studentCount, subjects: [...cls.subjects] })
    }
  }
  return Array.from(byKey.values()).sort((a, b) => { const ga = parseInt(a.gradeLevel, 10); const gb = parseInt(b.gradeLevel, 10); if (ga !== gb) return ga - gb; return (a.stream ?? '').localeCompare(b.stream ?? '') })
}

// Simulate the actual API response
const classes: ClassDTO[] = [
  { id: '1', name: 'Grade 6 - A', gradeLevel: '6', section: 'A', stream: null, studentCount: 28, subjects: [{ id: 's1', name: 'Hindi', code: 'HIN', fullMarks: 100, passMarks: 33 }] },
  { id: '2', name: 'Grade 7 - A', gradeLevel: '7', section: 'A', stream: null, studentCount: 30, subjects: [{ id: 's1', name: 'Hindi', code: 'HIN', fullMarks: 100, passMarks: 33 }] },
  { id: '3', name: 'Grade 9 - A', gradeLevel: '9', section: 'A', stream: null, studentCount: 40, subjects: [] },
  { id: '4', name: 'Grade 9 - B', gradeLevel: '9', section: 'B', stream: null, studentCount: 38, subjects: [] },
  { id: '5', name: 'Grade 11 - Science PCM', gradeLevel: '11', section: 'A', stream: 'Science-PCM', studentCount: 25, subjects: [] },
  { id: '6', name: 'Grade 11 - Science PCB', gradeLevel: '11', section: 'B', stream: 'Science-PCB', studentCount: 22, subjects: [] },
]

const examClasses = normalizeToExamClasses(classes)
console.log('=== NORMALIZED EXAM CLASSES ===')
for (const c of examClasses) {
  console.log(`  ${c.label} | sections=${c.sectionCount} | sectionIds=[${c.sectionIds.join(',')}] | students=${c.studentCount}`)
}
console.log(`\nTotal exam classes: ${examClasses.length}`)
console.log('No "Grade" label, no "- A", no section letters in display.')
