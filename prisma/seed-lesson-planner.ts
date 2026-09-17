/**
 * seed-lesson-planner — the Curriculum Master Library + demo adoption for
 * the Automatic Curriculum Execution Lesson Planner.
 *
 * Principles (same as seed-teacher-hub.ts):
 *  • runtime-resolved ids only — school by slug, teachers by email,
 *    classes/subjects by query; NO hardcoded cuids;
 *  • idempotent — deletes this seed's scope, then re-creates;
 *  • relative dates (holidays, start dates) so the demo never goes stale;
 *  • REAL curriculum — the master rows below are the published,
 *    rationalized NCERT/CBSE syllabi (2023+ rationalization is current
 *    through the 2026-27 session). Nothing is invented: where a school
 *    hasn't imported a syllabus (Hindi in this demo) the planner shows an
 *    honest "Curriculum unavailable" state.
 *
 * Run: bun run db:seed-lesson-planner
 */

import { db } from '../src/lib/db'
import {
  loadHolidaySet,
  loadPacing,
  computeCoursePlanFromStart,
  todayStr,
} from '../src/lib/lesson-planner'

const BOARD = 'CBSE'
const SESSION = '2026-2027'
const MINUTES_PER_PERIOD = 45
/** teaching began ~8 weeks ago → believable mid-term progress everywhere */
const START_DAYS_AGO = 56

// ─── the master library (REAL NCERT rationalized syllabi) ─────────────
// [topicName, estimatedMinutes, description?]

type SeedTopic = [string, number, string?]
type SeedUnit = [string, SeedTopic[]]

const MASTER: Record<'Grade 9' | 'Grade 10', Record<string, SeedUnit[]>> = {
  'Grade 9': {
    MATH: [
      ['Number Systems', [
        ['Real Numbers', 495, 'Irrational numbers, real numbers and their decimal expansions, representing on the number line, operations, laws of exponents.'],
      ]],
      ['Algebra', [
        ['Polynomials', 405, 'Degree, zeroes of a polynomial, remainder & factor theorem, algebraic identities.'],
        ['Linear Equations in Two Variables', 270, 'Solutions, graph of a linear equation, equations of lines parallel to the axes.'],
      ]],
      ['Coordinate Geometry', [
        ['Coordinate Geometry', 270, "Cartesian plane, plotting points, abscissa & ordinate, quadrants."],
      ]],
      ['Geometry', [
        ['Lines and Angles', 270, 'Pairs of angles, parallel lines and a transversal, angle sum property.'],
        ['Triangles', 450, 'Congruence criteria, inequalities in a triangle, properties of isosceles triangles.'],
        ['Quadrilaterals', 315, 'Parallelogram properties, mid-point theorem.'],
        ['Circles', 450, 'Chords, angles subtended, cyclic quadrilaterals.'],
      ]],
      ['Mensuration', [
        ["Heron's Formula", 225, 'Area of a triangle from its sides; areas of quadrilaterals.'],
        ['Surface Areas and Volumes', 360, 'Right circular cone, sphere, hemisphere and combinations.'],
      ]],
      ['Statistics', [
        ['Statistics', 270, 'Collection, presentation, bar graphs, histograms, frequency polygons.'],
      ]],
    ],
    PHY: [
      ['Physics', [
        ['Motion', 585, 'Distance & displacement, uniform/non-uniform motion, equations of motion, graphs, uniform circular motion.'],
        ['Force and Laws of Motion', 495, "Newton's three laws, inertia, momentum, conservation of momentum."],
        ['Gravitation', 450, 'Universal law, free fall, mass vs weight, thrust & pressure, Archimedes’ principle, buoyancy.'],
        ['Work and Energy', 405, 'Work done, kinetic & potential energy, conservation of energy, power.'],
        ['Sound', 450, 'Production & propagation, characteristics, reflection & echo, range of hearing, SONAR, human ear.'],
      ]],
    ],
    CHEM: [
      ['Chemistry', [
        ['Matter in Our Surroundings', 315, 'States of matter, change of state, evaporation & cooling.'],
        ['Is Matter Around Us Pure', 450, 'Mixtures, solutions, concentration, separation techniques, compounds vs mixtures.'],
        ['Atoms and Molecules', 495, 'Laws of chemical combination, atomic & molecular mass, mole concept.'],
        ['Structure of the Atom', 405, 'Atomic models, valency, isotopes & isobars.'],
      ]],
    ],
    BIO: [
      ['Biology', [
        ['The Fundamental Unit of Life', 405, 'Cell structure, plasma membrane, organelles, osmosis.'],
        ['Tissues', 405, 'Plant and animal tissues, their structure and function.'],
        ['Improvement in Food Resources', 270, 'Crop production & management, animal husbandry.'],
      ]],
    ],
    ENG: [
      ['Beehive — Prose', [
        ['The Fun They Had', 270, 'Isaac Asimov imagines schools of the future.'],
        ['The Sound of Music', 270, 'Evelyn Glennie and Bismillah Khan — two lives in music.'],
        ['The Little Girl', 270, 'Kezia rediscovers her father’s love.'],
        ['A Truly Beautiful Mind', 270, 'The life of Albert Einstein.'],
        ['The Snake and the Mirror', 270, 'A doctor’s midnight encounter.'],
        ['My Childhood', 270, 'A. P. J. Abdul Kalam’s early years.'],
        ['Reach for the Top', 270, 'Santosh Yadav and Maria Sharapova.'],
        ['Kathmandu', 270, 'Vikram Seth’s travelogue.'],
        ['If I Were You', 270, 'Gerrard outwits an intruder — a play.'],
      ]],
      ['Beehive — Poetry', [
        ['The Road Not Taken', 135, 'Robert Frost — choices and their consequences.'],
        ['Wind', 135, 'Subramania Bharati — the wind as friend and destroyer.'],
        ['Rain on the Roof', 135, 'Coates Kinney — memory in the patter of rain.'],
        ['The Lake Isle of Innisfree', 135, 'W. B. Yeats — longing for a quiet island.'],
        ['A Legend of the Northland', 135, 'A ballad about greed.'],
        ['No Men Are Foreign', 135, 'James Kirkup — oneness of humankind.'],
        ['On Killing a Tree', 135, 'Gieve Patel — what it really takes to kill a tree.'],
        ['A Slumber Did My Spirit Seal', 135, 'Wordsworth — loss and acceptance.'],
      ]],
      ['Moments — Supplementary', [
        ['The Lost Child', 180, 'A child separated from his parents at a fair.'],
        ['The Adventures of Toto', 180, 'Ruskin Bond’s mischievous monkey.'],
        ['Iswaran the Storyteller', 180, 'A cook whose stories come alive.'],
        ['In the Kingdom of Fools', 180, 'A folktale about a foolish king.'],
        ['The Happy Prince', 180, 'Oscar Wilde’s statue and the swallow.'],
        ['The Last Leaf', 180, "O. Henry — hope painted on a wall."],
        ['A House Is Not a Home', 180, 'Zan Gaudioso — rebuilding after a fire.'],
        ['The Beggar', 180, 'Anton Chekhov — kindness that changes a life.'],
      ]],
    ],
    SOC: [
      ['India and the Contemporary World — I', [
        ['The French Revolution', 405, 'Causes, events and legacy of 1789.'],
        ['Socialism in Europe and the Russian Revolution', 360, '1917 and the making of the USSR.'],
        ['Nazism and the Rise of Hitler', 360, 'Weimar Republic to the Second World War.'],
      ]],
      ['Contemporary India — I', [
        ['India — Size and Location', 180, 'India in the world; standard meridian.'],
        ['Physical Features of India', 360, 'The Himalaya, plains, plateau, coast and islands.'],
        ['Drainage', 270, 'Himalayan and peninsular river systems; lakes.'],
        ['Climate', 360, 'Monsoon mechanism; seasons; distribution of rainfall.'],
        ['Natural Vegetation and Wildlife', 270, 'Forest types; conservation.'],
        ['Population', 270, 'Size, distribution, growth; census concepts.'],
      ]],
      ['Democratic Politics — I', [
        ['What is Democracy? Why Democracy?', 270, 'Features, merits and limits of democracy.'],
        ['Constitutional Design', 270, 'Making of the Indian Constitution.'],
        ['Electoral Politics', 315, 'Elections, EC, challenges.'],
        ['Working of Institutions', 315, 'Parliament, executive, judiciary.'],
        ['Democratic Rights', 270, 'Fundamental rights in practice.'],
      ]],
      ['Economics', [
        ['The Story of Village Palampur', 270, 'Factors of production through a village.'],
        ['People as Resource', 270, 'Human capital, education, health, unemployment.'],
        ['Poverty as a Challenge', 270, 'Poverty line, groups vulnerable to poverty, anti-poverty measures.'],
      ]],
    ],
    // HINDI deliberately NOT seeded → honest "Curriculum unavailable" state.
  },
  'Grade 10': {
    MATH: [
      ['Number Systems', [
        ['Real Numbers', 450, 'Euclid’s division lemma, HCF & LCM, irrationality of √2, √3, √5, decimal expansions.'],
      ]],
      ['Algebra', [
        ['Polynomials', 405, 'Geometrical meaning of zeroes; relationship between zeroes and coefficients.'],
        ['Pair of Linear Equations in Two Variables', 585, 'Graphical & algebraic methods; consistency; word problems.'],
        ['Quadratic Equations', 540, 'Standard form, factorisation, quadratic formula, discriminant, applications.'],
        ['Arithmetic Progressions', 495, 'nth term, sum of n terms, everyday applications.'],
      ]],
      ['Coordinate Geometry', [
        ['Coordinate Geometry', 270, 'Distance formula, section formula, area of a triangle.'],
      ]],
      ['Geometry', [
        ['Triangles', 495, 'Similarity criteria, Basic Proportionality Theorem, areas.'],
        ['Circles', 315, 'Tangent to a circle; number of tangents from a point.'],
      ]],
      ['Trigonometry', [
        ['Introduction to Trigonometry', 495, 'Ratios, angles of specific values, trigonometric identities.'],
        ['Some Applications of Trigonometry', 225, 'Heights and distances.'],
      ]],
      ['Mensuration', [
        ['Areas Related to Circles', 270, 'Sectors and segments; combinations of plane figures.'],
        ['Surface Areas and Volumes', 405, 'Combinations of solids; conversion of solids.'],
      ]],
      ['Statistics and Probability', [
        ['Statistics', 315, 'Mean/median/mode of grouped data; ogives.'],
        ['Probability', 225, 'Classical definition; simple problems.'],
      ]],
    ],
    PHY: [
      ['Physics', [
        ['Light — Reflection and Refraction', 630, 'Spherical mirrors, mirror formula, refraction, lens formula, power of a lens.'],
        ['The Human Eye and the Colourful World', 360, 'Accommodation, defects of vision, prism dispersion, scattering.'],
        ['Electricity', 585, 'Ohm’s law, resistance, series & parallel, heating effect, electric power.'],
        ['Magnetic Effects of Electric Current', 450, 'Magnetic field, solenoid, force on a conductor, electric motor, generator, domestic circuits.'],
      ]],
    ],
    CHEM: [
      ['Chemistry', [
        ['Chemical Reactions and Equations', 360, 'Balancing equations, types of reactions, corrosion, rancidity.'],
        ['Acids, Bases and Salts', 450, 'pH scale, neutralisation, important salts and their uses.'],
        ['Metals and Non-metals', 450, 'Physical & chemical properties, reactivity series, extraction, alloys.'],
        ['Carbon and its Compounds', 585, 'Covalent bonding, homologous series, functional groups, ethanol & ethanoic acid, soaps.'],
      ]],
    ],
    BIO: [
      ['Biology', [
        ['Life Processes', 720, 'Nutrition, respiration, transport, excretion.'],
        ['Control and Coordination', 450, 'Nervous system, human brain, hormones in animals.'],
        ['How do Organisms Reproduce?', 495, 'Asexual & sexual reproduction, human reproductive system, reproductive health.'],
        ['Heredity', 315, 'Mendel’s contributions, sex determination.'],
        ['Our Environment', 225, 'Ecosystem, food chains, ozone depletion, waste management.'],
        ['Sustainable Management of Natural Resources', 180, 'Forests, water, coal & petroleum; the 5 Rs.'],
      ]],
    ],
    ENG: [
      ['First Flight — Prose', [
        ['A Letter to God', 270, 'Lencho’s unshakeable faith.'],
        ['Nelson Mandela: Long Walk to Freedom', 315, 'Apartheid to inauguration — Mandela reflects.'],
        ['Two Stories about Flying', 315, 'The seagull’s first flight; the black aeroplane.'],
        ['From the Diary of Anne Frank', 315, 'A young writer in hiding.'],
        ['Glimpses of India', 270, 'A baker from Goa; Coorg; tea from Assam.'],
        ['Mijbil the Otter', 270, 'Gavin Maxwell’s otter and their journey.'],
        ['Madam Rides the Bus', 270, 'Valli’s first bus ride.'],
        ['The Sermon at Benares', 270, 'Buddha’s counsel to Kisa Gotami.'],
        ['The Proposal', 315, 'Chekhov’s farce about a marriage proposal.'],
      ]],
      ['First Flight — Poetry', [
        ['Dust of Snow', 135, 'Robert Frost — a crow changes a mood.'],
        ['Fire and Ice', 135, 'Frost — how the world might end.'],
        ['A Tiger in the Zoo', 135, 'Leslie Norris — freedom versus cage.'],
        ['How to Tell Wild Animals', 135, 'Carolyn Wells — humorous field guide.'],
        ['The Ball Poem', 135, 'John Berryman — learning loss.'],
        ['Amanda!', 135, 'Robin Klein — a child’s daydreams.'],
        ['The Trees', 135, 'Adrienne Rich — trees moving out.'],
        ['Fog', 135, 'Carl Sandburg — fog as a cat.'],
        ['The Tale of Custard the Dragon', 135, 'Ogden Nash — a “cowardly” dragon.'],
        ['For Anne Gregory', 135, 'Yeats — beauty and inner self.'],
      ]],
      ['Footprints without Feet — Supplementary', [
        ['A Triumph of Surgery', 180, 'A pampered dog restored.'],
        ["The Thief's Story", 180, 'Trust and transformation.'],
        ['The Midnight Visitor', 180, 'A secret agent out-thought.'],
        ['A Question of Trust', 180, 'A thief robbed by a thief.'],
        ['Footprints without Feet', 180, 'An invisible scientist.'],
        ['The Making of a Scientist', 180, 'Richard Ebright’s curiosity.'],
        ['The Necklace', 225, "Maupassant — the price of pride."],
        ['Bholi', 225, 'A “dull” child finds her voice.'],
        ['The Book That Saved the Earth', 180, 'A play about Martians and a book.'],
      ]],
    ],
    SOC: [
      ['India and the Contemporary World — II', [
        ['The Rise of Nationalism in Europe', 405, 'Frankfurt parliament, unification of Germany & Italy.'],
        ['Nationalism in India', 450, 'Rowlatt Act to Salt March; the Civil Disobedience Movement.'],
        ['The Making of a Global World', 405, 'Silk routes, the Great Depression, rebuilding a world economy.'],
        ['Print Culture and the Modern World', 315, 'Print revolution and its social impact.'],
      ]],
      ['Contemporary India — II', [
        ['Resources and Development', 315, 'Classification, development, soil erosion & conservation.'],
        ['Forest and Wildlife Resources', 270, 'Biodiversity, categories of forests & wildlife, conservation.'],
        ['Water Resources', 270, 'Multipurpose projects, rainwater harvesting.'],
        ['Agriculture', 315, 'Cropping patterns, institutional reforms, food security.'],
        ['Minerals and Energy Resources', 315, 'Distribution, conservation, conventional & non-conventional energy.'],
        ['Manufacturing Industries', 315, 'Classification, location factors, industrial pollution.'],
        ['Lifelines of National Economy', 270, 'Roadways, railways, ports, international trade.'],
      ]],
      ['Democratic Politics — II', [
        ['Power-sharing', 270, 'Belgium & Sri Lanka; forms of power-sharing.'],
        ['Federalism', 315, 'Indian federalism, decentralisation, local government.'],
        ['Gender, Religion and Caste', 270, 'Social divisions and politics.'],
        ['Political Parties', 315, 'National & state parties; challenges; reforms.'],
        ['Outcomes of Democracy', 270, 'Accountable, responsive, legitimate government.'],
      ]],
      ['Understanding Economic Development', [
        ['Development', 270, 'Income, HDI, sustainability.'],
        ['Sectors of the Indian Economy', 315, 'Primary, secondary, tertiary; organised vs unorganised.'],
        ['Money and Credit', 315, 'Barter to money; formal & informal credit; SHGs.'],
        ['Globalisation and the Indian Economy', 315, 'MNCs, liberalisation, fair globalisation.'],
      ]],
    ],
  },
}

// ─── demo adoption wiring ─────────────────────────────────────────────

const SUBJECT_LABELS: Record<string, string> = {
  MATH: 'Mathematics',
  PHY: 'Physics',
  CHEM: 'Chemistry',
  BIO: 'Biology',
  ENG: 'English',
  SOC: 'Social Science',
  HINDI: 'Hindi',
}

const dayStr = (d: Date): string => d.toISOString().slice(0, 10)
const daysAgoDate = (n: number): Date => {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - n)
  return d
}
const daysAheadDate = (n: number): Date => daysAgoDate(-n)

async function main() {
  const school = await db.school.findFirst({ where: { slug: 'demo-school' } })
  if (!school) throw new Error('demo-school not found')

  const classes = await db.class.findMany({ where: { schoolId: school.id }, orderBy: { name: 'asc' } })
  const c9 = classes.find((c) => c.name.startsWith('Grade 9'))
  const c10 = classes.find((c) => c.name.startsWith('Grade 10'))
  if (!c9 || !c10) throw new Error('Grade 9 / Grade 10 classes not found')

  const teacherBy = async (email: string) => {
    const u = await db.user.findFirst({ where: { email, role: 'TEACHER' }, select: { id: true } })
    if (!u) throw new Error(`teacher user ${email} not found`)
    const t = await db.teacher.findFirst({ where: { userId: u.id } })
    if (!t) throw new Error(`teacher row for ${email} not found`)
    return t
  }
  const rohan = await teacherBy('rohan.mehta@greenwood.edu.in')
  const arjun = await teacherBy('teacher2@demoschool.edu')
  const priya = await teacherBy('teacher3@demoschool.edu')
  const kavita = await teacherBy('teacher1@demoschool.edu')

  // subject resolution — prefer the rows the existing 9-A timetable uses
  const allSubjects = await db.subject.findMany({ where: { schoolId: school.id } })
  const ttSubjectIds = new Set(
    (await db.timetable.findMany({ where: { classId: c9.id }, select: { subjectId: true } }))
      .map((r) => r.subjectId)
      .filter((s): s is string => Boolean(s)),
  )
  const pickSubject = (key: string) => {
    const label = SUBJECT_LABELS[key]
    const candidates = allSubjects.filter((s) => s.name === label)
    if (!candidates.length) throw new Error(`subject ${label} not found`)
    return candidates.find((s) => ttSubjectIds.has(s.id)) ?? candidates[0]
  }
  const subjectByKey: Record<string, { id: string; name: string }> = {}
  for (const key of Object.keys(SUBJECT_LABELS)) {
    const s = pickSubject(key)
    subjectByKey[key] = { id: s.id, name: s.name }
  }

  // who teaches what (ClassSubjectAssignment with teacherId)
  const assignmentPlan: { classId: string; subjectKey: string; teacherId: string }[] = []
  for (const cls of [c9, c10]) {
    for (const key of ['MATH', 'PHY', 'CHEM', 'BIO', 'ENG', 'SOC', 'HINDI']) {
      const teacherId =
        key === 'MATH' ? rohan.id : key === 'ENG' || key === 'SOC' ? priya.id : key === 'HINDI' ? kavita.id : arjun.id
      assignmentPlan.push({ classId: cls.id, subjectKey: key, teacherId })
    }
  }

  const today = todayStr()
  console.log(`seeding for today=${today} · school=${school.slug}`)

  // ── 1. reset this seed's scope (idempotent) ──
  await db.lessonExecution.deleteMany({ where: { schoolId: school.id } })
  await db.scheduledCurriculumTopic.deleteMany({ where: { schoolId: school.id } })
  await db.schoolCurriculum.deleteMany({ where: { schoolId: school.id } })
  await db.curriculumMasterTopic.deleteMany({ where: { board: BOARD, session: SESSION } })
  await db.classSubjectAssignment.deleteMany({ where: { classId: { in: [c9.id, c10.id] } } })
  await db.timetable.deleteMany({ where: { classId: c10.id } })
  await db.schoolEvent.deleteMany({ where: { schoolId: school.id, type: 'HOLIDAY' } })

  // ── 2. master library ──
  let masterCount = 0
  for (const [className, bySubject] of Object.entries(MASTER) as ['Grade 9' | 'Grade 10', Record<string, SeedUnit[]>][]) {
    for (const [subjectKey, units] of Object.entries(bySubject)) {
      for (const [uIdx, [unitName, topics]] of units.entries()) {
        for (const [tIdx, [topicName, minutes, description]] of topics.entries()) {
          await db.curriculumMasterTopic.create({
            data: {
              board: BOARD,
              session: SESSION,
              className,
              subjectKey,
              unitOrder: uIdx + 1,
              unitName,
              topicOrder: tIdx + 1,
              topicName,
              description: description ?? null,
              estimatedMinutes: minutes,
            },
          })
          masterCount++
        }
      }
    }
  }
  console.log(`master topics created: ${masterCount}`)

  // ── 3. teaching assignments ──
  for (const a of assignmentPlan) {
    await db.classSubjectAssignment.create({
      data: {
        schoolId: school.id,
        classId: a.classId,
        subjectId: subjectByKey[a.subjectKey].id,
        teacherId: a.teacherId,
        isCore: a.subjectKey !== 'HINDI',
        isActive: true,
        examinable: a.subjectKey !== 'HINDI',
        displayOrder: Object.keys(SUBJECT_LABELS).indexOf(a.subjectKey),
      },
    })
  }
  console.log(`assignments created: ${assignmentPlan.length}`)

  // ── 4. Grade 10-A timetable (MATH exactly 5 periods/week = 225 min) ──
  const PERIOD_TIMES: [string, string][] = [
    ['08:30', '09:15'], ['09:15', '10:00'], ['10:00', '10:45'], ['11:00', '11:45'],
    ['11:45', '12:30'], ['12:45', '13:30'], ['13:30', '14:15'],
  ]
  const GRID: string[][] = [
    // Mon                Tue                 Wed                 Thu                 Fri                 Sat
    ['MATH', 'PHY', 'CHEM', 'BIO', 'ENG', 'HINDI', 'LIB'],
    ['PHY', 'CHEM', 'MATH', 'ENG', 'HINDI', 'BIO', 'GAMES'],
    ['MATH', 'BIO', 'PHY', 'CHEM', 'ENG', 'HINDI', 'GAMES'],
    ['CHEM', 'ENG', 'HINDI', 'MATH', 'PHY', 'BIO', 'LIB'],
    ['BIO', 'HINDI', 'ENG', 'PHY', 'CHEM', 'GAMES', 'GAMES'],
    ['ENG', 'PHY', 'CHEM', 'BIO', 'HINDI', 'MATH', 'GAMES'],
  ]
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  let ttCount = 0
  for (const [dIdx, day] of DAYS.entries()) {
    for (const [pIdx, key] of GRID[dIdx].entries()) {
      const [start, end] = PERIOD_TIMES[pIdx]
      const free = key === 'LIB' || key === 'GAMES'
      await db.timetable.create({
        data: {
          schoolId: school.id,
          classId: c10.id,
          subjectId: free ? null : subjectByKey[key].id,
          day,
          period: pIdx + 1,
          startTime: start,
          endTime: end,
          teacherName: free ? 'Staff' : key === 'MATH' ? 'Rohan Mehta' : key === 'ENG' || key === 'SOC' ? 'Priya Iyer' : key === 'HINDI' ? 'Kavita Sharma' : 'Arjun Nair',
          room: free ? (key === 'LIB' ? 'Library' : 'Field') : `R-${10}${pIdx + 1}`,
        },
      })
      ttCount++
    }
  }
  console.log(`Grade 10-A timetable rows: ${ttCount}`)

  // ── 5. holidays (relative so the demo stays alive) ──
  const holidayPlan: { title: string; startDate: Date; endDate: Date | null }[] = [
    { title: 'Founders’ Day', startDate: daysAgoDate(12), endDate: null },
    { title: 'Autumn Break', startDate: daysAheadDate(5), endDate: null },
    { title: 'Diwali Holidays', startDate: daysAheadDate(12), endDate: daysAheadDate(13) },
  ]
  for (const h of holidayPlan) {
    await db.schoolEvent.create({
      data: {
        schoolId: school.id,
        title: h.title,
        description: 'School closed — no teaching days scheduled.',
        type: 'HOLIDAY',
        startDate: h.startDate,
        endDate: h.endDate,
        audience: 'ALL',
      },
    })
  }
  console.log(`holidays: ${holidayPlan.map((h) => `${h.title} ${dayStr(h.startDate)}`).join(' · ')}`)

  // ── 6. school instances + schedule via the REAL engine ──
  const startDate = daysAgoDate(START_DAYS_AGO)
  const holidays = await loadHolidaySet(school.id, dayStr(daysAgoDate(START_DAYS_AGO + 30)), dayStr(daysAheadDate(400)))

  for (const cls of [c9, c10]) {
    const className = (cls.name.match(/^Grade \d+/) ?? [cls.name])[0] as 'Grade 9' | 'Grade 10'
    for (const key of Object.keys(MASTER[className] ?? {})) {
      const subject = subjectByKey[key]
      const units = MASTER[className][key]
      const unitLabel = units.length === 1 && units[0][0] === SUBJECT_LABELS[key] ? undefined : undefined
      const versionLabel = `CBSE (NCERT) · ${className} ${subject.name} · 2026–27`
      const curriculum = await db.schoolCurriculum.create({
        data: {
          schoolId: school.id,
          classId: cls.id,
          subjectId: subject.id,
          board: BOARD,
          session: SESSION,
          versionLabel,
          startDate,
          minutesPerPeriod: MINUTES_PER_PERIOD,
          status: 'ACTIVE',
        },
      })
      const topics: { id: string; unitOrder: number; unitName: string; topicOrder: number; topicName: string; description: string | null; estimatedMinutes: number }[] = []
      for (const [uIdx, [unitName, unitTopics]] of units.entries()) {
        for (const [tIdx, [topicName, minutes, description]] of unitTopics.entries()) {
          const t = await db.schoolCurriculumTopic.create({
            data: {
              curriculumId: curriculum.id,
              unitOrder: uIdx + 1,
              unitName,
              topicOrder: tIdx + 1,
              topicName,
              description: description ?? null,
              estimatedMinutes: minutes,
            },
          })
          topics.push(t)
        }
      }
      void unitLabel

      const pacing = await loadPacing(cls.id, subject.id, MINUTES_PER_PERIOD)
      const plan = computeCoursePlanFromStart(topics, startDate, holidays, pacing, MINUTES_PER_PERIOD)
      const teacherId =
        key === 'MATH' ? rohan.id : key === 'ENG' || key === 'SOC' ? priya.id : key === 'HINDI' ? kavita.id : arjun.id

      let completed = 0
      for (const [i, w] of plan.entries()) {
        const topic = topics.find((t) => t.id === w.topicId)!
        // a topic is history only when its whole span ran out before today —
        // a topic still spanning today stays PENDING and becomes Today's Lesson
        const isPast = w.lastDay < today
        const slot = await db.scheduledCurriculumTopic.create({
          data: {
            schoolId: school.id,
            classId: cls.id,
            subjectId: subject.id,
            curriculumTopicId: topic.id,
            sequence: i + 1,
            plannedDate: new Date(`${w.day}T00:00:00.000Z`),
            minutesAllocated: topic.estimatedMinutes,
            status: isPast ? 'COMPLETED' : 'PENDING',
          },
        })
        if (isPast) {
          await db.lessonExecution.create({
            data: {
              schoolId: school.id,
              scheduledTopicId: slot.id,
              teacherId,
              classId: cls.id,
              subjectId: subject.id,
              taughtOn: new Date(`${w.day}T00:00:00.000Z`),
              minutesTaught: topic.estimatedMinutes,
              startedAt: new Date(`${w.day}T03:05:00.000Z`),
              completedAt: new Date(`${w.day}T04:15:00.000Z`),
            },
          })
          completed++
        }
      }
      const onDeck = plan.find((w) => w.lastDay >= today)
      const todayName = onDeck ? topics.find((t) => t.id === onDeck.topicId)?.topicName : '—'
      console.log(
        `${cls.name} · ${subject.name.padEnd(15)} pacing=${pacing.source === 'TIMETABLE' ? `${pacing.periodsPerWeek}p/wk` : 'fallback 45/day'} · topics=${topics.length} · completed=${completed} · on-deck="${todayName}" @ ${onDeck?.day ?? '—'}→${onDeck?.lastDay ?? '—'}`,
      )
    }
  }

  console.log('seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
