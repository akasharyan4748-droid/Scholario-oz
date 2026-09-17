/**
 * seed-curriculum-execution — the AUTOMATED CURRICULUM EXECUTION demo state.
 *
 * Lesson Planner = automated curriculum execution workspace:
 *   Teacher → Class + Subject → master curriculum appears automatically →
 *   scheduling engine derives the day-wise plan from the class timetable +
 *   academic calendar (holidays) → teacher executes (start / complete) →
 *   progress updates. No manual "New Lesson Plan" anywhere.
 *
 * What this seeds:
 *  1. MASTER CURRICULUM LIBRARY (schoolId = null, global reference data):
 *     CBSE 2026-27 Class 9 + Class 10 Mathematics — chapters and topics from
 *     the rationalized NCERT/CBSE syllabus (NOT invented, NOT AI-generated;
 *     Euclid's Division Lemma retained under Real Numbers per the product
 *     spec's own example). Each topic carries an estimated teaching duration.
 *  2. GRADE 10 - A TIMETABLE (the scheduling source of truth): Mon–Fri,
 *     7 periods of 45 min. Mathematics lands exactly on the spec's example —
 *     Mon P2, Tue P4, Wed P2, Thu P4, Fri P1 → 5 periods/week · 225 min/week
 *     (Rohan Mehta). Other subjects fill the grid with their assigned
 *     teachers (Chemistry/Biology → Arjun; English/Social Science/Hindi →
 *     the 9-A subject rows' teachers, display-only).
 *     Grade 9 - A already has a real timetable (Math 8 periods/week).
 *  3. ACADEMIC CALENDAR — SchoolEvent HOLIDAY rows: Independence Day
 *     (15 Aug 2026, past), School Annual Day (24 Sep 2026, upcoming — the
 *     scheduler must visibly skip it), Gandhi Jayanti (2 Oct 2026).
 *  4. LESSON EXECUTION HISTORY (school-scoped):
 *     · Grade 10 - A Math: Unit 1 topic 1 (Euclid's Division Lemma)
 *       completed Mon 14 Sep P2. Cursor = Fundamental Theorem of Arithmetic
 *       → TODAY (Tue 15 Sep, P4) per the spec's example. Up next: Irrational
 *       Numbers (16 Sep), Decimal Expansions (17 Sep)…
 *     · Grade 9 - A Math: 10 topics completed on the real past teaching
 *       slots (Mon P1/P4, Tue P1, Wed P1, Thu P1/P5, Fri P1, Sat P1) up to
 *       Mon 14 Sep. Cursor = Unit 3 topic 1 → TODAY (Tue 15 Sep, P1).
 *  5. The teaching assignment Mathematics · Grade 10 - A → Rohan Mehta
 *     (kept from the previous seed — TEST C multi-class scope).
 *
 * NOT seeded (honest negative states): curricula for Physics/Chemistry/
 * English/… → those teachers see "Curriculum unavailable"; the Library
 * architecture allows adding them later without code changes.
 *
 * Run: bun run db:seed-curriculum
 */

import { db } from '../src/lib/db'

/** lesson/UTC day helpers */
const utcDay = (y: number, m: number, d: number): Date => new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
const dayAt = (base: Date, offsetDays: number, h = 10): Date => {
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() + offsetDays)
  d.setUTCHours(h, 0, 0, 0)
  return d
}

interface TopicSeed {
  title: string
  est: number
  outcomes?: string[]
}
interface UnitSeed {
  title: string
  topics: TopicSeed[]
}

// ── CBSE Class 10 Mathematics (rationalized NCERT structure) ──
const class10Math: UnitSeed[] = [
  {
    title: 'Real Numbers',
    topics: [
      { title: "Euclid's Division Lemma", est: 45, outcomes: ['State Euclid’s division lemma', 'Apply the lemma to find HCF of two integers'] },
      { title: 'Fundamental Theorem of Arithmetic', est: 45, outcomes: ['State the fundamental theorem of arithmetic', 'Use prime factorisation to find HCF and LCM'] },
      { title: 'Irrational Numbers', est: 45, outcomes: ['Prove that √2, √3 and √5 are irrational', 'Use the fundamental theorem in proofs by contradiction'] },
      { title: 'Decimal Expansions', est: 45, outcomes: ['Classify decimal expansions as terminating or non-terminating recurring', 'Convert recurring decimals to fractions'] },
    ],
  },
  {
    title: 'Polynomials',
    topics: [
      { title: 'Geometrical Meaning of the Zeroes of a Polynomial', est: 45, outcomes: ['Relate zeroes of a polynomial to its graph', 'Read zeroes from x-axis intersections'] },
      { title: 'Relationship between Zeroes and Coefficients', est: 90, outcomes: ['Find the sum and product of zeroes from coefficients', 'Form a quadratic polynomial from its zeroes'] },
    ],
  },
  {
    title: 'Pair of Linear Equations in Two Variables',
    topics: [
      { title: 'Graphical Method of Solution', est: 45, outcomes: ['Represent a pair of linear equations graphically', 'Identify unique, infinite and no solutions from graphs'] },
      { title: 'Substitution Method', est: 45, outcomes: ['Solve pairs of linear equations by substitution'] },
      { title: 'Elimination Method', est: 45, outcomes: ['Solve pairs of linear equations by elimination', 'Choose the efficient method for a given system'] },
    ],
  },
  {
    title: 'Quadratic Equations',
    topics: [
      { title: 'Introduction to Quadratic Equations', est: 45, outcomes: ['Recognise the standard form of a quadratic equation'] },
      { title: 'Solution of a Quadratic Equation by Factorisation', est: 45, outcomes: ['Solve quadratic equations by factorisation'] },
      { title: 'Nature of Roots', est: 45, outcomes: ['Use the discriminant to predict the nature of roots'] },
      { title: 'Word Problems on Quadratic Equations', est: 90, outcomes: ['Model real situations as quadratic equations', 'Interpret solutions in context'] },
    ],
  },
  {
    title: 'Arithmetic Progressions',
    topics: [
      { title: 'Introduction to Arithmetic Progressions', est: 45, outcomes: ['Identify an arithmetic progression and its common difference'] },
      { title: 'nth Term of an AP', est: 45, outcomes: ['Find the nth term of an AP', 'Solve problems using the nth term'] },
      { title: 'Sum of First n Terms of an AP', est: 45, outcomes: ['Derive and apply the sum formula', 'Solve practical problems on sums'] },
    ],
  },
  {
    title: 'Triangles',
    topics: [
      { title: 'Similar Figures', est: 45, outcomes: ['Distinguish congruent from similar figures'] },
      { title: 'Similarity of Triangles', est: 45, outcomes: ['State the Basic Proportionality Theorem', 'Apply BPT to divided triangle sides'] },
      { title: 'Criteria for Similarity of Triangles', est: 90, outcomes: ['Apply AAA, SSS and SAS similarity criteria'] },
      { title: 'Areas of Similar Triangles', est: 45, outcomes: ['Relate areas of similar triangles to side ratios'] },
      { title: 'Pythagoras Theorem', est: 90, outcomes: ['State and prove the Pythagoras theorem', 'Apply the theorem and its converse'] },
    ],
  },
  {
    title: 'Coordinate Geometry',
    topics: [
      { title: 'Distance Formula', est: 45, outcomes: ['Find the distance between two points'] },
      { title: 'Section Formula', est: 45, outcomes: ['Find the point dividing a segment in a given ratio'] },
      { title: 'Area of a Triangle', est: 45, outcomes: ['Compute the area of a triangle from coordinates'] },
    ],
  },
  {
    title: 'Introduction to Trigonometry',
    topics: [
      { title: 'Trigonometric Ratios', est: 45, outcomes: ['Define sine, cosine, tangent and their reciprocals'] },
      { title: 'Trigonometric Ratios of Some Specific Angles', est: 45, outcomes: ['Recall ratios for 0°, 30°, 45°, 60°, 90°'] },
      { title: 'Trigonometric Identities', est: 90, outcomes: ['Prove and apply fundamental trigonometric identities'] },
      { title: 'Trigonometric Ratios of Complementary Angles', est: 45, outcomes: ['Apply complementary angle relationships'] },
    ],
  },
  {
    title: 'Some Applications of Trigonometry',
    topics: [
      { title: 'Heights and Distances', est: 90, outcomes: ['Solve real-life height and distance problems using trigonometry'] },
    ],
  },
  {
    title: 'Circles',
    topics: [
      { title: 'Tangent to a Circle', est: 45, outcomes: ['Define a tangent and its properties'] },
      { title: 'Number of Tangents from a Point on a Circle', est: 45, outcomes: ['Apply tangent-length properties'] },
    ],
  },
  {
    title: 'Areas Related to Circles',
    topics: [
      { title: 'Area of Sector and Segment', est: 45, outcomes: ['Compute areas of sectors and segments'] },
      { title: 'Combinations of Plane Figures', est: 90, outcomes: ['Find areas of combined plane figures involving circles'] },
    ],
  },
  {
    title: 'Surface Areas and Volumes',
    topics: [
      { title: 'Surface Area of Combinations of Solids', est: 45, outcomes: ['Compute surface areas of combined solids'] },
      { title: 'Volume of Combinations of Solids', est: 45, outcomes: ['Compute volumes of combined solids'] },
      { title: 'Conversion of Solids', est: 45, outcomes: ['Solve melting/recasting conversion problems'] },
    ],
  },
  {
    title: 'Statistics',
    topics: [
      { title: 'Mean of Grouped Data', est: 45, outcomes: ['Compute the mean of grouped data by all three methods'] },
      { title: 'Mode of Grouped Data', est: 45, outcomes: ['Compute the modal class and mode'] },
      { title: 'Median of Grouped Data', est: 45, outcomes: ['Compute the median of grouped data'] },
      { title: 'Graphical Representation of Cumulative Frequency (Ogive)', est: 45, outcomes: ['Draw and read ogives'] },
    ],
  },
  {
    title: 'Probability',
    topics: [
      { title: 'Classical Definition of Probability', est: 45, outcomes: ['Compute probabilities of simple experiments'] },
      { title: 'Simple Problems on Probability', est: 45, outcomes: ['Solve standard probability problems'] },
    ],
  },
]

// ── CBSE Class 9 Mathematics (rationalized NCERT structure) ──
const class9Math: UnitSeed[] = [
  {
    title: 'Number Systems',
    topics: [
      { title: 'Irrational Numbers', est: 45, outcomes: ['Define irrational numbers', 'Locate √2 and √3 on the number line'] },
      { title: 'Real Numbers and their Decimal Expansions', est: 45, outcomes: ['Classify real numbers by their decimal expansions'] },
      { title: 'Representing Real Numbers on the Number Line', est: 45, outcomes: ['Represent real numbers on the number line (successive magnification)'] },
      { title: 'Operations on Real Numbers', est: 45, outcomes: ['Add, subtract, multiply and divide irrational numbers', 'Rationalise denominators'] },
      { title: 'Laws of Exponents for Real Numbers', est: 45, outcomes: ['Apply laws of exponents to real numbers'] },
    ],
  },
  {
    title: 'Polynomials',
    topics: [
      { title: 'Polynomials in One Variable', est: 45, outcomes: ['Define polynomials, degrees and coefficients'] },
      { title: 'Zeroes of a Polynomial', est: 45, outcomes: ['Find and verify zeroes of polynomials'] },
      { title: 'Remainder Theorem', est: 45, outcomes: ['Apply the remainder theorem'] },
      { title: 'Factorisation of Polynomials', est: 90, outcomes: ['Factorise polynomials using identities and the factor theorem'] },
      { title: 'Algebraic Identities', est: 45, outcomes: ['Apply standard algebraic identities'] },
    ],
  },
  {
    title: 'Coordinate Geometry',
    topics: [
      { title: 'The Cartesian Plane', est: 45, outcomes: ['Describe the x-axis, y-axis, origin and quadrants'] },
      { title: 'Plotting a Point in the Plane', est: 45, outcomes: ['Plot points given as ordered pairs', 'Read coordinates of plotted points'] },
    ],
  },
  {
    title: 'Linear Equations in Two Variables',
    topics: [
      { title: 'Linear Equations in Two Variables', est: 45, outcomes: ['Recognise linear equations and their solutions'] },
      { title: 'Solution of a Linear Equation', est: 45, outcomes: ['Find multiple solutions of a linear equation'] },
      { title: 'Graph of a Linear Equation in Two Variables', est: 45, outcomes: ['Draw the graph of a linear equation'] },
      { title: 'Equations of Lines Parallel to the x-axis and y-axis', est: 45, outcomes: ['Write equations of axis-parallel lines'] },
    ],
  },
  {
    title: 'Lines and Angles',
    topics: [
      { title: 'Basic Terms and Definitions', est: 45, outcomes: ['Use line, ray, segment and angle vocabulary precisely'] },
      { title: 'Intersecting Lines and Non-intersecting Lines', est: 45, outcomes: ['Relate parallel lines and transversals'] },
      { title: 'Pairs of Angles', est: 45, outcomes: ['Apply linear pair, vertically opposite and angle-sum properties'] },
    ],
  },
  {
    title: 'Triangles',
    topics: [
      { title: 'Congruence of Triangles', est: 45, outcomes: ['Define congruence of triangles'] },
      { title: 'Criteria for Congruence of Triangles', est: 90, outcomes: ['Apply SAS, ASA and SSS congruence criteria'] },
      { title: 'Properties of Isosceles Triangles', est: 45, outcomes: ['Prove and apply isosceles triangle properties'] },
      { title: 'Inequalities in a Triangle', est: 45, outcomes: ['Apply triangle inequality results'] },
    ],
  },
  {
    title: 'Quadrilaterals',
    topics: [
      { title: 'Angle Sum Property of a Quadrilateral', est: 45, outcomes: ['Apply the angle sum property'] },
      { title: 'Types of Quadrilaterals', est: 45, outcomes: ['Classify quadrilaterals'] },
      { title: 'Properties of a Parallelogram', est: 90, outcomes: ['Prove and apply parallelogram properties'] },
      { title: 'Mid-point Theorem', est: 45, outcomes: ['State and apply the mid-point theorem'] },
    ],
  },
  {
    title: 'Circles',
    topics: [
      { title: 'Circles and Related Terms', est: 45, outcomes: ['Use chord, arc, segment and sector vocabulary'] },
      { title: 'Angle Subtended by a Chord at a Point', est: 45, outcomes: ['Apply chord-angle results'] },
      { title: 'Perpendicular from the Centre to a Chord', est: 45, outcomes: ['Apply the perpendicular-chord theorem'] },
      { title: 'Equal Chords and their Distances from the Centre', est: 45, outcomes: ['Relate equal chords and their distances'] },
      { title: 'Cyclic Quadrilaterals', est: 45, outcomes: ['Apply cyclic quadrilateral angle properties'] },
    ],
  },
  {
    title: "Heron's Formula",
    topics: [
      { title: 'Area of a Triangle by Heron’s Formula', est: 45, outcomes: ['Compute triangle area from three sides'] },
      { title: 'Application of Heron’s Formula', est: 45, outcomes: ['Apply Heron’s formula to quadrilaterals by splitting'] },
    ],
  },
  {
    title: 'Surface Areas and Volumes',
    topics: [
      { title: 'Surface Area of a Right Circular Cone', est: 45, outcomes: ['Compute cone surface areas (curved and total)'] },
      { title: 'Surface Area of a Sphere', est: 45, outcomes: ['Compute sphere and hemisphere surface areas'] },
      { title: 'Volume of a Right Circular Cone', est: 45, outcomes: ['Compute cone volumes'] },
      { title: 'Volume of a Sphere', est: 45, outcomes: ['Compute sphere and hemisphere volumes'] },
    ],
  },
  {
    title: 'Statistics',
    topics: [
      { title: 'Collection of Data', est: 45, outcomes: ['Distinguish primary and secondary data'] },
      { title: 'Presentation of Data', est: 45, outcomes: ['Build frequency distribution tables'] },
      { title: 'Graphical Representation of Data', est: 45, outcomes: ['Draw and read bar graphs and histograms'] },
      { title: 'Measures of Central Tendency', est: 45, outcomes: ['Compute mean, median and mode of ungrouped data'] },
    ],
  },
]

async function main() {
  const school = await db.school.findFirst({ where: { slug: 'demo-school' } })
  if (!school) throw new Error('demo-school not found')

  const rohan = await db.user.findFirst({ where: { email: 'rohan.mehta@greenwood.edu.in', schoolId: school.id } })
  if (!rohan) throw new Error('Rohan Mehta not found')

  const byClassName = async (name: string) => {
    const c = await db.class.findFirst({ where: { schoolId: school.id, name } })
    if (!c) throw new Error(`class ${name} not found`)
    return c
  }
  const g9 = await byClassName('Grade 9 - A')
  const g10 = await byClassName('Grade 10 - A')
  const math = await db.subject.findFirst({ where: { schoolId: school.id, name: 'Mathematics' } })
  if (!math) throw new Error('subject Mathematics not found')

  // ── 1. Master curriculum library (idempotent reset) ──
  // LessonExecution rows reference topics via FK — clear executions first.
  await db.lessonExecution.deleteMany({ where: { schoolId: school.id } })
  const existing = await db.curriculum.findMany({ select: { id: true } })
  for (const c of existing) {
    await db.curriculum.delete({ where: { id: c.id } }) // cascades units+topics
  }

  const topicId = new Map<string, string>() // "10:U1T1" | "9:U2T3"
  for (const [classLevel, units] of [
    ['10', class10Math],
    ['9', class9Math],
  ] as const) {
    await db.curriculum.create({
      data: {
        board: 'CBSE',
        academicSession: '2026-27',
        classLevel,
        subjectName: 'Mathematics',
        version: 1,
        status: 'ACTIVE',
        units: {
          create: units.map((u, ui) => ({
            sequence: ui + 1,
            title: u.title,
            estimatedMinutes: u.topics.reduce((acc, t) => acc + t.est, 0),
            topics: {
              create: u.topics.map((t, ti) => ({
                sequence: ti + 1,
                title: t.title,
                estimatedMinutes: t.est,
                learningOutcomes: t.outcomes ? JSON.stringify(t.outcomes) : null,
              })),
            },
          })),
        },
      },
    })
    // re-read to capture generated topic ids
    const cur = await db.curriculum.findFirstOrThrow({
      where: { board: 'CBSE', academicSession: '2026-27', classLevel, subjectName: 'Mathematics' },
      include: { units: { orderBy: { sequence: 'asc' }, include: { topics: { orderBy: { sequence: 'asc' } } } } },
    })
    for (const u of cur.units) {
      for (const t of u.topics) {
        topicId.set(`${classLevel}:U${u.sequence}T${t.sequence}`, t.id)
      }
    }
  }
  const c10Count = class10Math.reduce((acc, u) => acc + u.topics.length, 0)
  const c9Count = class9Math.reduce((acc, u) => acc + u.topics.length, 0)
  console.log(`   Master curriculum: Class 10 Mathematics (${c10Count} topics, ${class10Math.length} units) + Class 9 Mathematics (${c9Count} topics, ${class9Math.length} units)`)

  // ── 2. Grade 10 - A timetable (scheduling source of truth) ──
  const subjects = await db.subject.findMany({ where: { schoolId: school.id } })
  const subjId = (name: string): string => {
    // prefer the canonical subject row actually used by this class's assignments
    const s = subjects.find((x) => x.name === name)
    if (!s) throw new Error(`subject ${name} not found`)
    return s.id
  }
  const chemistry10 = subjects.find((s) => s.id === 'cmtartdqd0017ju86dh4dfzjn') ?? subjects.find((s) => s.name === 'Chemistry')
  const biology10 = subjects.find((s) => s.id === 'cmtartdqe0019ju86eatope5p') ?? subjects.find((s) => s.name === 'Biology')
  const english = subjects.find((s) => s.id === 'cmtartdqc0015ju86rqmybxug')
  const social = subjects.find((s) => s.id === 'cmu1feb2j0005olc7ytn2svg4')
  const hindi = subjects.find((s) => s.id === 'cmu1feb2l0007olc7kq039a3n')
  const physics = subjects.find((s) => s.id === 'cmtartdqb0013ju86uxi12rsb')

  await db.timetable.deleteMany({ where: { schoolId: school.id, classId: g10.id } })
  const PERIODS: { p: number; start: string; end: string }[] = [
    { p: 1, start: '08:30', end: '09:15' },
    { p: 2, start: '09:15', end: '10:00' },
    { p: 3, start: '10:00', end: '10:45' },
    { p: 4, start: '11:00', end: '11:45' },
    { p: 5, start: '11:45', end: '12:30' },
    { p: 6, start: '13:15', end: '14:00' },
    { p: 7, start: '14:00', end: '14:45' },
  ]
  // [day][period] = subject id + teacher display name. Mathematics = spec example:
  // Mon P2 · Tue P4 · Wed P2 · Thu P4 · Fri P1 → 5 periods/week · 225 min/week.
  const grid: Record<string, (null | { sid: string; teacher: string })[]> = {
    Monday: [
      { sid: subjId('English'), teacher: 'Ms. Priya Iyer' },
      { sid: math.id, teacher: 'Rohan Mehta' },
      { sid: chemistry10!.id, teacher: 'Mr. Arjun Nair' },
      { sid: english!.id, teacher: 'Ms. Priya Iyer' },
      { sid: biology10!.id, teacher: 'Mr. Arjun Nair' },
      { sid: social!.id, teacher: 'Ms. Priya Iyer' },
      { sid: hindi!.id, teacher: 'Ms. Priya Iyer' },
    ],
    Tuesday: [
      { sid: chemistry10!.id, teacher: 'Mr. Arjun Nair' },
      { sid: social!.id, teacher: 'Ms. Priya Iyer' },
      { sid: english!.id, teacher: 'Ms. Priya Iyer' },
      { sid: math.id, teacher: 'Rohan Mehta' },
      { sid: biology10!.id, teacher: 'Mr. Arjun Nair' },
      { sid: hindi!.id, teacher: 'Ms. Priya Iyer' },
      { sid: physics!.id, teacher: 'Mrs. Kavita Sharma' },
    ],
    Wednesday: [
      { sid: biology10!.id, teacher: 'Mr. Arjun Nair' },
      { sid: math.id, teacher: 'Rohan Mehta' },
      { sid: hindi!.id, teacher: 'Ms. Priya Iyer' },
      { sid: english!.id, teacher: 'Ms. Priya Iyer' },
      { sid: social!.id, teacher: 'Ms. Priya Iyer' },
      { sid: chemistry10!.id, teacher: 'Mr. Arjun Nair' },
      null,
    ],
    Thursday: [
      { sid: english!.id, teacher: 'Ms. Priya Iyer' },
      { sid: physics!.id, teacher: 'Mrs. Kavita Sharma' },
      { sid: social!.id, teacher: 'Ms. Priya Iyer' },
      { sid: math.id, teacher: 'Rohan Mehta' },
      { sid: hindi!.id, teacher: 'Ms. Priya Iyer' },
      { sid: biology10!.id, teacher: 'Mr. Arjun Nair' },
      { sid: chemistry10!.id, teacher: 'Mr. Arjun Nair' },
    ],
    Friday: [
      { sid: math.id, teacher: 'Rohan Mehta' },
      { sid: chemistry10!.id, teacher: 'Mr. Arjun Nair' },
      null,
      { sid: biology10!.id, teacher: 'Mr. Arjun Nair' },
      { sid: english!.id, teacher: 'Ms. Priya Iyer' },
      { sid: social!.id, teacher: 'Ms. Priya Iyer' },
      { sid: hindi!.id, teacher: 'Ms. Priya Iyer' },
    ],
  }
  // NOTE: the grid above gives Mathematics exactly the spec §10 example —
  // Mon P2 · Tue P4 · Wed P2 · Thu P4 · Fri P1 → 5 periods/week · 225 min/week.
  void PERIODS

  for (const [day, row] of Object.entries(grid)) {
    for (let i = 0; i < row.length; i++) {
      const cell = row[i]
      if (!cell) continue
      await db.timetable.create({
        data: {
          schoolId: school.id,
          classId: g10.id,
          subjectId: cell.sid,
          day,
          period: PERIODS[i].p,
          startTime: PERIODS[i].start,
          endTime: PERIODS[i].end,
          teacherName: cell.teacher,
        },
      })
    }
  }
  const math10Slots = await db.timetable.findMany({ where: { schoolId: school.id, classId: g10.id, subjectId: math.id } })
  console.log(`   Grade 10 - A timetable seeded (${math10Slots.length} Mathematics periods/week): ${math10Slots.map((s) => `${s.day} P${s.period}`).join(' · ')}`)

  // teaching assignment Mathematics · Grade 10 - A → Rohan (TEST C scope)
  await db.classSubjectAssignment.upsert({
    where: { classId_subjectId: { classId: g10.id, subjectId: math.id } },
    update: { teacherId: rohan.id, isActive: true },
    create: {
      schoolId: school.id,
      classId: g10.id,
      subjectId: math.id,
      teacherId: rohan.id,
      isCore: true,
      isActive: true,
      examinable: true,
      displayOrder: 10,
    },
  })

  // ── 3. Academic calendar — holidays ──
  const holidaySeed = [
    { title: 'Independence Day', date: utcDay(2026, 8, 15), description: 'National holiday' },
    { title: 'School Annual Day', date: utcDay(2026, 9, 24), description: 'School closed for Annual Day celebrations' },
    { title: 'Gandhi Jayanti', date: utcDay(2026, 10, 2), description: 'National holiday' },
  ]
  for (const h of holidaySeed) {
    const exists = await db.schoolEvent.findFirst({
      where: { schoolId: school.id, type: 'HOLIDAY', title: h.title, startDate: h.date },
    })
    if (!exists) {
      await db.schoolEvent.create({
        data: { schoolId: school.id, title: h.title, description: h.description, type: 'HOLIDAY', startDate: h.date, audience: 'ALL' },
      })
    }
  }
  console.log('   Holidays: Independence Day (15 Aug) · School Annual Day (24 Sep) · Gandhi Jayanti (2 Oct)')

  // ── 4. Execution history ──
  // Sandbox "today" is 15 Sep 2026 (Tuesday). Grade 10 - A math slots:
  // Mon P2 · Tue P4 · Wed P2 · Thu P4 · Fri P1.
  //   → Euclid's Division Lemma completed Mon 14 Sep P2.
  //   → cursor = Fundamental Theorem of Arithmetic = TODAY (Tue 15 Sep, P4).
  const base = utcDay(2026, 9, 15) // today
  await db.lessonExecution.create({
    data: {
      schoolId: school.id,
      classId: g10.id,
      subjectId: math.id,
      teacherId: rohan.id,
      curriculumTopicId: topicId.get('10:U1T1')!,
      date: dayAt(base, -1, 10), // Mon 14 Sep
      period: 2,
      status: 'COMPLETED',
      completedAt: dayAt(base, -1, 10),
    },
  })

  // Grade 9 - A math slots: Mon P1+P4 · Tue P1 · Wed P1 · Thu P1+P5 · Fri P1 · Sat P1.
  // Ten completed topics on the ten real slots before today (Mon 7 Sep … Mon 14 Sep).
  const g9History: { key: string; date: Date; period: number }[] = [
    { key: '9:U1T1', date: dayAt(base, -8, 9), period: 1 },  // Mon 7 Sep P1
    { key: '9:U1T2', date: dayAt(base, -8, 12), period: 4 }, // Mon 7 Sep P4
    { key: '9:U1T3', date: dayAt(base, -7, 9), period: 1 },  // Tue 8 Sep P1
    { key: '9:U1T4', date: dayAt(base, -6, 9), period: 1 },  // Wed 9 Sep P1
    { key: '9:U1T5', date: dayAt(base, -5, 9), period: 1 },  // Thu 10 Sep P1
    { key: '9:U2T1', date: dayAt(base, -5, 12), period: 5 }, // Thu 10 Sep P5
    { key: '9:U2T2', date: dayAt(base, -4, 9), period: 1 },  // Fri 11 Sep P1
    { key: '9:U2T3', date: dayAt(base, -3, 9), period: 1 },  // Sat 12 Sep P1
    { key: '9:U2T4', date: dayAt(base, -1, 9), period: 1 },  // Mon 14 Sep P1
    { key: '9:U2T5', date: dayAt(base, -1, 12), period: 4 }, // Mon 14 Sep P4
  ]
  for (const h of g9History) {
    await db.lessonExecution.create({
      data: {
        schoolId: school.id,
        classId: g9.id,
        subjectId: math.id,
        teacherId: rohan.id,
        curriculumTopicId: topicId.get(h.key)!,
        date: h.date,
        period: h.period,
        status: 'COMPLETED',
        completedAt: h.date,
      },
    })
  }
  console.log(`   Execution history: Grade 10 - A — 1 completed (cursor = FTA, today Tue P4); Grade 9 - A — ${g9History.length} completed (cursor = Unit 3 T1, today Tue P1)`)
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
