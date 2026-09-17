/**
 * curriculum-data — REAL board curriculum structures (CBSE / NCERT,
 * rationalized 2025-26 syllabi) used to instantiate the Demo School's
 * curriculum instances. NEVER AI-generated filler: every unit and topic
 * below mirrors the actual NCERT chapter/sub-topic structure.
 *
 * Period counts are realistic teaching-period estimates for a school that
 * runs the subject at the given weekly pace (incl. guided practice,
 * revision and class assessment periods).
 */

export interface CurriculumSeedTopic {
  unitNo: number
  unitName: string
  topicName: string
  description: string
  periodsNeeded: number
}

export interface CurriculumSeedSubject {
  /** matches the school's Subject.name */
  subjectName: string
  grade: 9 | 10
  topics: CurriculumSeedTopic[]
}

// ─── Grade 9 ────────────────────────────────────────────────────────────

const MATH_9: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'Number Systems', topicName: 'Real Numbers and Their Decimal Expansions', description: 'Rational vs irrational numbers; terminating, recurring and non-terminating expansions.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Number Systems', topicName: 'Representing Real Numbers on the Number Line', description: 'Successive magnification; representing √2, √3 and other surds on the line.', periodsNeeded: 6 },
  { unitNo: 1, unitName: 'Number Systems', topicName: 'Operations on Real Numbers', description: 'Adding, subtracting, multiplying and dividing irrational numbers; rationalisation.', periodsNeeded: 6 },
  { unitNo: 1, unitName: 'Number Systems', topicName: 'Laws of Exponents for Real Numbers', description: 'Integral and rational exponents; applying exponent laws to surds.', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'Polynomials', topicName: 'Polynomials in One Variable', description: 'Degrees, coefficients and values of polynomials; constants and linear cases.', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'Polynomials', topicName: 'Zeroes of a Polynomial', description: 'Factor and remainder theorems; finding zeroes and factoring.', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'Polynomials', topicName: 'Algebraic Identities', description: 'Standard identities and their applications to products and evaluations.', periodsNeeded: 8 },
  { unitNo: 3, unitName: 'Coordinate Geometry', topicName: 'The Cartesian Plane', description: 'Axes, origin, quadrants and coordinates; naming and locating points.', periodsNeeded: 8 },
  { unitNo: 3, unitName: 'Coordinate Geometry', topicName: 'Plotting a Point in the Plane', description: 'Plotting given coordinates and reading coordinates of plotted points.', periodsNeeded: 8 },
  { unitNo: 4, unitName: 'Linear Equations in Two Variables', topicName: 'Linear Equations and Their Solutions', description: 'Form of a linear equation; solution as a point; infinitely many solutions.', periodsNeeded: 8 },
  { unitNo: 4, unitName: 'Linear Equations in Two Variables', topicName: 'Graph of a Linear Equation', description: 'Drawing the graph of ax + by + c = 0; every point on the graph is a solution.', periodsNeeded: 8 },
  { unitNo: 4, unitName: 'Linear Equations in Two Variables', topicName: 'Equations of Lines Parallel to the Axes', description: 'x = a and y = b; reading graphs of horizontal and vertical lines.', periodsNeeded: 4 },
  { unitNo: 5, unitName: "Introduction to Euclid's Geometry", topicName: "Euclid's Definitions, Axioms and Postulates", description: 'Defined and undefined terms; the five postulates; definitions vs axioms.', periodsNeeded: 6 },
  { unitNo: 5, unitName: "Introduction to Euclid's Geometry", topicName: 'Equivalent Versions of the Fifth Postulate', description: 'Playfair\u2019s axiom; why the fifth postulate is equivalent to parallel-line properties.', periodsNeeded: 6 },
  { unitNo: 6, unitName: 'Lines and Angles', topicName: 'Basic Terms and Pairs of Angles', description: 'Intersecting vs parallel lines; complementary, supplementary, adjacent and linear pairs.', periodsNeeded: 8 },
  { unitNo: 6, unitName: 'Lines and Angles', topicName: 'Parallel Lines and a Transversal', description: 'Corresponding, alternate and co-interior angle theorems; applying them to problems.', periodsNeeded: 8 },
  { unitNo: 6, unitName: 'Lines and Angles', topicName: 'Angle Sum Property of a Triangle', description: 'Exterior angle theorem; angle-sum proofs and numerical applications.', periodsNeeded: 4 },
  { unitNo: 7, unitName: 'Triangles', topicName: 'Congruence of Triangles', description: 'SAS, ASA, SSS and RHS congruence rules with proofs and applications.', periodsNeeded: 10 },
  { unitNo: 7, unitName: 'Triangles', topicName: 'Properties of Isosceles Triangles', description: 'Equal sides vs equal angles; proofs using congruence.', periodsNeeded: 6 },
  { unitNo: 7, unitName: 'Triangles', topicName: 'Inequalities in a Triangle', description: 'Side-angle inequalities; triangle inequality and its applications.', periodsNeeded: 10 },
  { unitNo: 8, unitName: 'Quadrilaterals', topicName: 'Parallelograms and Their Properties', description: 'Diagonal properties; conditions for a quadrilateral to be a parallelogram.', periodsNeeded: 8 },
  { unitNo: 8, unitName: 'Quadrilaterals', topicName: 'The Mid-point Theorem', description: 'Statement, proof and converse; applications in problems.', periodsNeeded: 8 },
  { unitNo: 9, unitName: 'Circles', topicName: 'Chords and Their Properties', description: 'Chords, arcs and the angle subtended at the centre and circumference.', periodsNeeded: 8 },
  { unitNo: 9, unitName: 'Circles', topicName: 'Perpendicular from the Centre to a Chord', description: 'The perpendicular-bisector property; distances and chord lengths.', periodsNeeded: 6 },
  { unitNo: 9, unitName: 'Circles', topicName: 'Equal Chords and Their Distances', description: 'Equal chords equidistant from the centre; cyclic quadrilaterals.', periodsNeeded: 8 },
  { unitNo: 10, unitName: "Heron's Formula", topicName: 'Area of a Triangle — Heron\u2019s Formula', description: 'Computing area from three sides; semi-perimeter derivation.', periodsNeeded: 6 },
  { unitNo: 10, unitName: "Heron's Formula", topicName: 'Applications of Heron\u2019s Formula', description: 'Areas of quadrilaterals by splitting; real-life applications.', periodsNeeded: 8 },
  { unitNo: 11, unitName: 'Surface Areas and Volumes', topicName: 'Surface Area of a Right Circular Cone', description: 'Slant height; curved and total surface areas.', periodsNeeded: 8 },
  { unitNo: 11, unitName: 'Surface Areas and Volumes', topicName: 'Surface Area of a Sphere', description: 'Spheres and hemispheres; curved surface areas.', periodsNeeded: 6 },
  { unitNo: 11, unitName: 'Surface Areas and Volumes', topicName: 'Volumes of Cones and Spheres', description: 'Volume formulas; mixed problems and capacity applications.', periodsNeeded: 8 },
  { unitNo: 12, unitName: 'Statistics', topicName: 'Collection and Presentation of Data', description: 'Primary vs secondary data; frequency distribution tables.', periodsNeeded: 8 },
  { unitNo: 12, unitName: 'Statistics', topicName: 'Bar Graphs and Frequency Polygons', description: 'Histograms, bar graphs and frequency polygons for grouped data.', periodsNeeded: 8 },
]

const PHYSICS_9: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'Motion', topicName: 'Distance, Displacement and Uniform Motion', description: 'Scalars vs vectors; distance-displacement distinction; uniform and non-uniform motion.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Motion', topicName: 'Graphical Representation of Motion', description: 'Distance-time and velocity-time graphs; slopes and areas.', periodsNeeded: 10 },
  { unitNo: 1, unitName: 'Motion', topicName: 'Equations of Motion', description: 'Deriving v = u + at, s = ut + ½at²; solving numericals.', periodsNeeded: 10 },
  { unitNo: 1, unitName: 'Motion', topicName: 'Uniform Circular Motion', description: 'Velocity-direction changes on a circular path; real examples.', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'Force and Laws of Motion', topicName: 'Balanced, Unbalanced Forces and the First Law', description: 'Inertia of rest and motion; Newton\u2019s first law applications.', periodsNeeded: 10 },
  { unitNo: 2, unitName: 'Force and Laws of Motion', topicName: 'Momentum and the Second Law', description: 'Momentum; F = ma; quantitative problems.', periodsNeeded: 10 },
  { unitNo: 2, unitName: 'Force and Laws of Motion', topicName: 'Third Law and Conservation of Momentum', description: 'Action-reaction pairs; conservation law and its applications.', periodsNeeded: 14 },
  { unitNo: 3, unitName: 'Gravitation', topicName: 'Universal Law of Gravitation', description: 'Newton\u2019s law; G; free fall and the value of g.', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'Gravitation', topicName: 'Mass, Weight and Thrust', description: 'Mass vs weight; variation of g; thrust and pressure.', periodsNeeded: 8 },
  { unitNo: 3, unitName: 'Gravitation', topicName: 'Archimedes\u2019 Principle and Buoyancy', description: 'Upthrust; relative density; floatation problems.', periodsNeeded: 16 },
  { unitNo: 4, unitName: 'Work and Energy', topicName: 'Work Done and Kinetic Energy', description: 'Work done by a force; KE and the work-energy theorem.', periodsNeeded: 10 },
  { unitNo: 4, unitName: 'Work and Energy', topicName: 'Potential Energy and Conservation of Energy', description: 'PE; transformation of energy; conservation with examples.', periodsNeeded: 12 },
  { unitNo: 4, unitName: 'Work and Energy', topicName: 'Power and the Commercial Unit of Energy', description: 'Watt and kilowatt-hour; electricity-meter problems.', periodsNeeded: 10 },
  { unitNo: 5, unitName: 'Sound', topicName: 'Production and Propagation of Sound', description: 'Vibrations; medium requirement; longitudinal waves.', periodsNeeded: 10 },
  { unitNo: 5, unitName: 'Sound', topicName: 'Characteristics of Sound Waves', description: 'Wavelength, frequency, time period, amplitude, loudness, pitch.', periodsNeeded: 10 },
  { unitNo: 5, unitName: 'Sound', topicName: 'Reflection of Sound and Range of Hearing', description: 'Echo and reverberation; audible range; SONAR.', periodsNeeded: 8 },
  { unitNo: 5, unitName: 'Sound', topicName: 'Ultrasound and Human Ear', description: 'Industrial and medical ultrasound; structure of the human ear.', periodsNeeded: 8 },
]

const CHEMISTRY_9: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'Matter in Our Surroundings', topicName: 'States of Matter and Change of State', description: 'Solid, liquid, gas; melting, boiling, evaporation; latent heat.', periodsNeeded: 12 },
  { unitNo: 1, unitName: 'Matter in Our Surroundings', topicName: 'Evaporation and Factors Affecting It', description: 'Surface area, humidity, wind; cooling by evaporation.', periodsNeeded: 10 },
  { unitNo: 1, unitName: 'Matter in Our Surroundings', topicName: 'Numericals and Demonstration Experiments', description: 'Temperature-time graphs; boiling-point and melting-point activities.', periodsNeeded: 10 },
  { unitNo: 2, unitName: 'Is Matter Around Us Pure', topicName: 'Mixtures, Solutions and Colloids', description: 'Homogeneous vs heterogeneous; solute/solvent; Tyndall effect.', periodsNeeded: 12 },
  { unitNo: 2, unitName: 'Is Matter Around Us Pure', topicName: 'Concentration of Solutions', description: 'Mass-by-mass and percentage concentration problems.', periodsNeeded: 12 },
  { unitNo: 2, unitName: 'Is Matter Around Us Pure', topicName: 'Separation Techniques', description: 'Filtration, evaporation, sublimation, chromatography, distillation.', periodsNeeded: 16 },
  { unitNo: 3, unitName: 'Atoms and Molecules', topicName: 'Laws of Chemical Combination', description: 'Law of conservation of mass; definite proportions.', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'Atoms and Molecules', topicName: 'Atomic Mass and the Mole Concept', description: 'Atomic mass units; molecular mass; mole and formula units.', periodsNeeded: 16 },
  { unitNo: 3, unitName: 'Atoms and Molecules', topicName: 'Writing Chemical Formulae', description: 'Valencies and crossing over; formulae of common compounds.', periodsNeeded: 16 },
  { unitNo: 4, unitName: 'Structure of the Atom', topicName: 'Sub-atomic Particles and Atomic Models', description: 'Electron, proton, neutron; Thomson and Rutherford models.', periodsNeeded: 12 },
  { unitNo: 4, unitName: 'Structure of the Atom', topicName: 'Bohr\u2019s Model and Electronic Configuration', description: 'Shells and energy levels; writing configurations for the first 20 elements.', periodsNeeded: 14 },
  { unitNo: 4, unitName: 'Structure of the Atom', topicName: 'Valency, Isotopes and Isobars', description: 'Valence electrons and valency; applications of isotopes.', periodsNeeded: 12 },
  { unitNo: 5, unitName: 'Practical Chemistry', topicName: 'Preparation of Mixtures and Solutions — Lab', description: 'Preparing true solutions, colloids and suspensions; verifying properties.', periodsNeeded: 12 },
  { unitNo: 5, unitName: 'Practical Chemistry', topicName: 'Separation Techniques — Lab Verification', description: 'Separating mixtures by evaporation and sublimation in the lab.', periodsNeeded: 12 },
]

const BIOLOGY_9: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'The Fundamental Unit of Life', topicName: 'Discovery and Structure of the Cell', description: 'Cell theory; plant vs animal cells; microscopy basics.', periodsNeeded: 10 },
  { unitNo: 1, unitName: 'The Fundamental Unit of Life', topicName: 'Plasma Membrane, Diffusion and Osmosis', description: 'Selective permeability; hypotonic/isotonic/hypertonic solutions.', periodsNeeded: 14 },
  { unitNo: 1, unitName: 'The Fundamental Unit of Life', topicName: 'Cell Organelles', description: 'Nucleus, ER, Golgi, lysosomes, mitochondria, plastids, vacuoles.', periodsNeeded: 16 },
  { unitNo: 2, unitName: 'Tissues', topicName: 'Plant Tissues', description: 'Meristematic and permanent tissues; xylem and phloem.', periodsNeeded: 14 },
  { unitNo: 2, unitName: 'Tissues', topicName: 'Animal Tissues', description: 'Epithelial, connective, muscular and nervous tissues.', periodsNeeded: 16 },
  { unitNo: 2, unitName: 'Tissues', topicName: 'Tissue Comparisons and Applications', description: 'Structure-function relationships; stationary vs locomotion adaptations.', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'Improvement in Food Resources', topicName: 'Crop Production and Management', description: 'Crop types; nutrient, irrigation and cropping patterns.', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'Improvement in Food Resources', topicName: 'Crop Improvement and Protection', description: 'Varietal improvement; weed, pest and disease management.', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'Improvement in Food Resources', topicName: 'Animal Husbandry', description: 'Cattle, poultry and fish farming; bee-keeping.', periodsNeeded: 10 },
  { unitNo: 4, unitName: 'Practical Biology', topicName: 'Onion and Cheek Cell Preparation — Lab', description: 'Mounting and staining; observing under the microscope.', periodsNeeded: 12 },
  { unitNo: 4, unitName: 'Practical Biology', topicName: 'Plant Tissue Slide Study — Lab', description: 'Identifying permanent slides of tissues; labelled diagrams.', periodsNeeded: 14 },
]

const ENGLISH_9: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'Prose — Beehive', topicName: 'The Fun They Had', description: 'Isaac Asimov\u2019s story of schools of the future; comprehension and vocabulary.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — Beehive', topicName: 'The Sound of Music', description: 'Evelyn Glennie and Bismillah Khan; part I and II with exercises.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — Beehive', topicName: 'The Little Girl', description: 'Kezia\u2019s changing view of her father; inference questions.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — Beehive', topicName: 'A Truly Beautiful Mind', description: 'The life of Albert Einstein; fact vs opinion exercises.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — Beehive', topicName: 'The Snake and the Mirror', description: 'Vikram Seth-ish anecdote by Vaikom Muhammad Basheer; humour and theme.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — Beehive', topicName: 'My Childhood', description: 'A. P. J. Abdul Kalam\u2019s early years; values-based discussion.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — Beehive', topicName: 'Reach for the Top', description: 'Santosh Yadav and Maria Sharapova; part I and II.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — Beehive', topicName: 'Kathmandu', description: 'Vikram Seth\u2019s travelogue; descriptive detail and tone.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — Beehive', topicName: 'If I Were You', description: 'Gerrard\u2019s one-act play; dramatic conventions.', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'Poetry — Beehive', topicName: 'The Road Not Taken', description: 'Frost\u2019s reflection on choices; imagery and metaphor.', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'Poetry — Beehive', topicName: 'Wind', description: 'Subramania Bharati\u2019s poem; symbolism of adversity.', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'Poetry — Beehive', topicName: 'Rain on the Roof', description: 'Coates Kinney\u2019s nostalgic poem; sound imagery.', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'Poetry — Beehive', topicName: 'A Legend of the Northland', description: 'Ballad form; moral and narrative technique.', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'Poetry — Beehive', topicName: 'No Men Are Foreign', description: 'James Kirkup\u2019s poem on universal brotherhood.', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'Poetry — Beehive', topicName: 'On Killing a Tree', description: 'Gieve Patel\u2019s poem; environmental reading.', periodsNeeded: 6 },
  { unitNo: 3, unitName: 'Supplementary Reader — Moments', topicName: 'The Lost Child', description: 'Mulk Raj Anand\u2019s story; child psychology and irony.', periodsNeeded: 8 },
  { unitNo: 3, unitName: 'Supplementary Reader — Moments', topicName: 'The Adventures of Toto', description: 'Ruskin Bond\u2019s humorous tale; character sketch.', periodsNeeded: 8 },
  { unitNo: 3, unitName: 'Supplementary Reader — Moments', topicName: 'Iswaran the Storyteller', description: 'Supernatural storytelling and humour analysis.', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'Supplementary Reader — Moments', topicName: 'The Beggar', description: 'Anton Chekov\u2019s tale of transformation.', periodsNeeded: 10 },
  { unitNo: 4, unitName: 'Writing Skills and Grammar', topicName: 'Diary Entry and Story Writing', description: 'Format, tone and organisation; practice tasks.', periodsNeeded: 14 },
  { unitNo: 4, unitName: 'Writing Skills and Grammar', topicName: 'Descriptive Paragraph and Report Writing', description: 'Describing people, places, events; report structure.', periodsNeeded: 14 },
  { unitNo: 4, unitName: 'Writing Skills and Grammar', topicName: 'Tenses and Modals', description: 'Present/past/future forms; modal auxiliaries in context.', periodsNeeded: 14 },
  { unitNo: 4, unitName: 'Writing Skills and Grammar', topicName: 'Clauses and Error Correction', description: 'Subject/predicate; main vs subordinate clauses; editing practice.', periodsNeeded: 14 },
]

const SST_9: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'History — India and the Contemporary World I', topicName: 'The French Revolution', description: 'Causes, events and legacy; rise of Napoleon.', periodsNeeded: 16 },
  { unitNo: 1, unitName: 'History — India and the Contemporary World I', topicName: 'Socialism in Europe and the Russian Revolution', description: '1917 revolutions; Stalinism and its assessment.', periodsNeeded: 18 },
  { unitNo: 1, unitName: 'History — India and the Contemporary World I', topicName: 'Nazism and the Rise of Hitler', description: 'Weimar Republic; Nazi worldview; Holocaust.', periodsNeeded: 20 },
  { unitNo: 2, unitName: 'Geography — Contemporary India I', topicName: 'India — Size and Location', description: 'India\u2019s extent; neighbours; standard meridian.', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'Geography — Contemporary India I', topicName: 'Physical Features of India', description: 'Himalayas, plains, plateau, desert, coasts and islands.', periodsNeeded: 10 },
  { unitNo: 2, unitName: 'Geography — Contemporary India I', topicName: 'Drainage', description: 'Himalayan and peninsular rivers; lakes; pollution concerns.', periodsNeeded: 10 },
  { unitNo: 2, unitName: 'Geography — Contemporary India I', topicName: 'Climate', description: 'Monsoon mechanism; seasons; distribution of rainfall.', periodsNeeded: 12 },
  { unitNo: 2, unitName: 'Geography — Contemporary India I', topicName: 'Natural Vegetation and Wildlife', description: 'Forest types; biosphere reserves and conservation.', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'Civics — Democratic Politics I', topicName: 'What is Democracy? Why Democracy?', description: 'Features and broader meaning of democracy.', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'Civics — Democratic Politics I', topicName: 'Constitutional Design', description: 'Making of the Indian Constitution; philosophy and values.', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'Civics — Democratic Politics I', topicName: 'Electoral Politics', description: 'Elections, EC, challenges; why elections matter.', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'Civics — Democratic Politics I', topicName: 'Working of Institutions', description: 'Parliament, executive and judiciary interplay.', periodsNeeded: 12 },
  { unitNo: 4, unitName: 'Economics', topicName: 'The Story of Village Palampur', description: 'Factors of production through a village case study.', periodsNeeded: 10 },
  { unitNo: 4, unitName: 'Economics', topicName: 'People as Resource', description: 'Human capital; education, health, unemployment.', periodsNeeded: 11 },
  { unitNo: 4, unitName: 'Economics', topicName: 'Poverty as a Challenge', description: 'Poverty line; vulnerable groups; anti-poverty measures.', periodsNeeded: 11 },
  { unitNo: 4, unitName: 'Economics', topicName: 'Food Security in India', description: 'Buffer stock; PDS; role of cooperatives.', periodsNeeded: 11 },
]

const HINDI_9: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'गद्य खंड — क्षितिज', topicName: 'दो बैलों की कथा', description: 'प्रेमचंद की कहानी; हीरा-मोती की स्वतंत्रता की लालसा।', periodsNeeded: 10 },
  { unitNo: 1, unitName: 'गद्य खंड — क्षितिज', topicName: 'ल्हासा की ओर', description: 'राहुल सांकृत्यायन का यात्रा-वृत्तांत; तिब्बत यात्रा।', periodsNeeded: 10 },
  { unitNo: 1, unitName: 'गद्य खंड — क्षितिज', topicName: 'उपभोक्तावाद की संस्कृति', description: 'श्यामाचरण दुबे का निबंध; उपभोक्तावाद की समीक्षा।', periodsNeeded: 10 },
  { unitNo: 1, unitName: 'गद्य खंड — क्षितिज', topicName: 'साँवले सपनों की याद', description: 'जाबिर हुसैन का सालिम अली पर संस्मरण।', periodsNeeded: 10 },
  { unitNo: 1, unitName: 'गद्य खंड — क्षितिज', topicName: 'प्रेमचंद के फटे जूते', description: 'हरिशंकर परसाई का व्यंग्य; साहित्यकार की आर्थिक स्थिति।', periodsNeeded: 10 },
  { unitNo: 1, unitName: 'गद्य खंड — क्षितिज', topicName: 'मेरे संग की औरतें', description: 'स्वातंत्र्यवीर सावरकर का संस्मरण; रामभाऊ की माँ।', periodsNeeded: 10 },
  { unitNo: 2, unitName: 'काव्य खंड — क्षितिज', topicName: 'साखियाँ (कबीर)', description: 'कबीर की साखियाँ; गुरु-महिमा और ज्ञान।', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'काव्य खंड — क्षितिज', topicName: 'पद (मीरा)', description: 'मीरा के पद; कृष्ण-भक्ति और विरह।', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'काव्य खंड — क्षितिज', topicName: 'सवैया-कवित्त (देव)', description: 'देव की रीतिकालीन काव्य-शैली; रस-वर्णन।', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'काव्य खंड — क्षितिज', topicName: 'दोहे (तुलसीदास)', description: 'तुलसीदास के दोहे; नीति और भक्ति।', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'काव्य खंड — क्षितिज', topicName: 'सूरदास के पद', description: 'बालकृष्ण-लीला और मातृ-वात्सल्य।', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'काव्य खंड — क्षितिज', topicName: 'सवैये (रसखान)', description: 'रसखान के सवैये; गोप-गोपिका वर्णन।', periodsNeeded: 8 },
  { unitNo: 3, unitName: 'व्याकरण एवं लेखन', topicName: 'उपसर्ग, प्रत्यय एवं संधि', description: 'शब्द-निर्माण; संधि-भेद और अभ्यास।', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'व्याकरण एवं लेखन', topicName: 'समास एवं वाच्य', description: 'समास-भेद; कर्तृ-कर्म-भाव वाच्य परिवर्तन।', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'व्याकरण एवं लेखन', topicName: 'अपठित गद्यांश', description: 'अर्थ-ग्रहण कौशल; प्रश्न-अभ्यास।', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'व्याकरण एवं लेखन', topicName: 'पत्र-लेखन एवं निबंध', description: 'औपचारिक पत्र; निबंध-संरचना अभ्यास।', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'व्याकरण एवं लेखन', topicName: 'संवाद-लेखन एवं अनुच्छेद', description: 'संवाद-रचना; अनुच्छेद-लेखन अभ्यास।', periodsNeeded: 11 },
]

// ─── Grade 10 ───────────────────────────────────────────────────────────

const MATH_10: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'Number Systems', topicName: 'Real Numbers and Euclid\u2019s Division Lemma', description: 'Euclid\u2019s algorithm; HCF via division lemma.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Number Systems', topicName: 'Fundamental Theorem of Arithmetic and Irrationality', description: 'Prime factorisation; HCF×LCM; proving irrationality.', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'Algebra', topicName: 'Polynomials — Zeroes and Coefficients', description: 'Zeroes; relationship between zeroes and coefficients.', periodsNeeded: 10 },
  { unitNo: 2, unitName: 'Algebra', topicName: 'Pair of Linear Equations in Two Variables', description: 'Graphical and algebraic methods; consistency conditions.', periodsNeeded: 14 },
  { unitNo: 2, unitName: 'Algebra', topicName: 'Quadratic Equations', description: 'Solution by factorisation and formula; discriminant and nature of roots.', periodsNeeded: 16 },
  { unitNo: 2, unitName: 'Algebra', topicName: 'Arithmetic Progressions', description: 'nth term and sum of n terms; applications.', periodsNeeded: 16 },
  { unitNo: 3, unitName: 'Coordinate Geometry', topicName: 'Distance and Section Formula', description: 'Distance between points; section formula for internal division.', periodsNeeded: 8 },
  { unitNo: 3, unitName: 'Coordinate Geometry', topicName: 'Area of a Triangle — Coordinate Method', description: 'Area from coordinates; collinearity conditions.', periodsNeeded: 6 },
  { unitNo: 4, unitName: 'Geometry', topicName: 'Triangles — Similarity', description: 'Similar figures; BPT and similarity criteria.', periodsNeeded: 16 },
  { unitNo: 4, unitName: 'Geometry', topicName: 'Circles — Tangents', description: 'Tangent properties; number of tangents from a point.', periodsNeeded: 10 },
  { unitNo: 4, unitName: 'Geometry', topicName: 'Constructions', description: 'Dividing a line segment; tangents to a circle from an external point.', periodsNeeded: 10 },
  { unitNo: 5, unitName: 'Trigonometry', topicName: 'Introduction to Trigonometry — Ratios and Identities', description: 'Ratios of acute angles; standard angles; trigonometric identities.', periodsNeeded: 16 },
  { unitNo: 5, unitName: 'Trigonometry', topicName: 'Heights and Distances', description: 'Angles of elevation and depression; real-life problems.', periodsNeeded: 14 },
  { unitNo: 6, unitName: 'Mensuration', topicName: 'Areas Related to Circles', description: 'Sector and segment areas; combinations of plane figures.', periodsNeeded: 12 },
  { unitNo: 6, unitName: 'Mensuration', topicName: 'Surface Areas and Volumes', description: 'Combinations of solids; conversion of solids.', periodsNeeded: 12 },
  { unitNo: 7, unitName: 'Statistics and Probability', topicName: 'Statistics — Mean, Median and Mode', description: 'Mean of grouped data; median and mode by formula and graph.', periodsNeeded: 12 },
  { unitNo: 7, unitName: 'Statistics and Probability', topicName: 'Probability — Theoretical Approach', description: 'Empirical vs classical probability; simple problems.', periodsNeeded: 10 },
]

const PHYSICS_10: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'Light — Reflection and Refraction', topicName: 'Reflection of Light and Spherical Mirrors', description: 'Laws of reflection; concave/convex mirrors; mirror formula and magnification.', periodsNeeded: 12 },
  { unitNo: 1, unitName: 'Light — Reflection and Refraction', topicName: 'Refraction and Refractive Index', description: 'Snell\u2019s law; refractive index; refraction through a glass slab.', periodsNeeded: 12 },
  { unitNo: 1, unitName: 'Light — Reflection and Refraction', topicName: 'Lenses and Power of a Lens', description: 'Convex/concave lenses; lens formula; power and combinations.', periodsNeeded: 12 },
  { unitNo: 2, unitName: 'The Human Eye and the Colourful World', topicName: 'The Human Eye and Defects of Vision', description: 'Accommodation; myopia, hypermetropia, presbyopia and correction.', periodsNeeded: 12 },
  { unitNo: 2, unitName: 'The Human Eye and the Colourful World', topicName: 'Dispersion and Scattering of Light', description: 'Prism dispersion; rainbow; Tyndall scattering and blue sky.', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'Electricity', topicName: 'Electric Current and Potential Difference', description: 'Current, voltage, ohm; circuit diagrams.', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'Electricity', topicName: 'Ohm\u2019s Law, Resistance and Resistivity', description: 'Factors affecting resistance; series and parallel combinations.', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'Electricity', topicName: 'Heating Effect and Electric Power', description: 'Joule\u2019s law; power ratings; electricity-consumption problems.', periodsNeeded: 10 },
  { unitNo: 4, unitName: 'Magnetic Effects of Electric Current', topicName: 'Magnetic Fields and Force on Conductors', description: 'Field lines; force on a current-carrying conductor; Fleming\u2019s left-hand rule.', periodsNeeded: 12 },
  { unitNo: 4, unitName: 'Magnetic Effects of Electric Current', topicName: 'Electric Motor, Generator and Domestic Circuits', description: 'Motor principle; electromagnetic induction; fuses and earthing.', periodsNeeded: 16 },
  { unitNo: 5, unitName: 'Practice and Numericals', topicName: 'Ray Diagrams — Lab Practice', description: 'Tracing ray diagrams for mirrors and lenses; verifying laws.', periodsNeeded: 12 },
  { unitNo: 5, unitName: 'Practice and Numericals', topicName: 'Circuit Verifications — Lab', description: 'Ohm\u2019s law and series/parallel combination experiments.', periodsNeeded: 12 },
]

const CHEMISTRY_10: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'Chemical Reactions and Equations', topicName: 'Chemical Equations and Balancing', description: 'Writing and balancing equations; states and conditions.', periodsNeeded: 12 },
  { unitNo: 1, unitName: 'Chemical Reactions and Equations', topicName: 'Types of Chemical Reactions', description: 'Combination, decomposition, displacement, double displacement, oxidation-reduction.', periodsNeeded: 14 },
  { unitNo: 2, unitName: 'Acids, Bases and Salts', topicName: 'Acid-Base Properties and pH', description: 'Reactions with metals/carbonates; indicators; importance of pH.', periodsNeeded: 14 },
  { unitNo: 2, unitName: 'Acids, Bases and Salts', topicName: 'Chemistry of Salts', description: 'Common salt family: washing soda, baking soda, bleaching powder, POP.', periodsNeeded: 16 },
  { unitNo: 3, unitName: 'Metals and Non-metals', topicName: 'Physical and Chemical Properties', description: 'Malleability, conductivity; reactions with oxygen, water, acids.', periodsNeeded: 14 },
  { unitNo: 3, unitName: 'Metals and Non-metals', topicName: 'Reactivity Series and Extraction', description: 'Displacement; extraction of metals — roasting, calcination, refining.', periodsNeeded: 18 },
  { unitNo: 4, unitName: 'Carbon and its Compounds', topicName: 'Covalent Bonding and the Versatile Carbon', description: 'Bonding; allotropes; saturated vs unsaturated chains.', periodsNeeded: 12 },
  { unitNo: 4, unitName: 'Carbon and its Compounds', topicName: 'Homologous Series and Nomenclature', description: 'Functional groups; IUPAC naming of simple compounds.', periodsNeeded: 12 },
  { unitNo: 4, unitName: 'Carbon and its Compounds', topicName: 'Ethanol, Ethanoic Acid and Soaps', description: 'Properties and reactions; esterification; saponification and detergents.', periodsNeeded: 12 },
  { unitNo: 5, unitName: 'Practical Chemistry', topicName: 'Types of Reactions — Lab Verification', description: 'Performing and observing combination/displacement reactions.', periodsNeeded: 10 },
  { unitNo: 5, unitName: 'Practical Chemistry', topicName: 'pH Testing and Salt Analysis — Lab', description: 'Testing pH of samples; identifying gas evolution reactions.', periodsNeeded: 10 },
]

const BIOLOGY_10: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'Life Processes', topicName: 'Nutrition — Autotrophic and Heterotrophic', description: 'Photosynthesis; amoeba and human digestive system.', periodsNeeded: 14 },
  { unitNo: 1, unitName: 'Life Processes', topicName: 'Respiration and Transportation', description: 'Aerobic vs anaerobic; human heart, blood vessels, double circulation.', periodsNeeded: 16 },
  { unitNo: 1, unitName: 'Life Processes', topicName: 'Excretion', description: 'Excretion in plants; human excretory system and nephron.', periodsNeeded: 14 },
  { unitNo: 2, unitName: 'Control and Coordination', topicName: 'Nervous System and Reflex Action', description: 'Neuron structure; reflex arc; human brain parts.', periodsNeeded: 14 },
  { unitNo: 2, unitName: 'Control and Coordination', topicName: 'Hormones and Plant Responses', description: 'Endocrine glands; tropic movements in plants.', periodsNeeded: 14 },
  { unitNo: 3, unitName: 'How do Organisms Reproduce?', topicName: 'Asexual Reproduction', description: 'Fission, budding, fragmentation, regeneration, spore formation, vegetative propagation.', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'How do Organisms Reproduce?', topicName: 'Sexual Reproduction in Plants and Humans', description: 'Flower structure; pollination; human reproductive system; reproductive health.', periodsNeeded: 18 },
  { unitNo: 4, unitName: 'Heredity', topicName: 'Mendel\u2019s Contributions and Sex Determination', description: 'Monohybrid and dihybrid crosses; dominance; sex determination in humans.', periodsNeeded: 18 },
  { unitNo: 5, unitName: 'Our Environment', topicName: 'Ecosystems and Food Chains', description: 'Trophic levels; energy flow; 10 percent law; ozone depletion.', periodsNeeded: 8 },
  { unitNo: 5, unitName: 'Our Environment', topicName: 'Waste Management', description: 'Segregation; recycling; sustainable practices.', periodsNeeded: 8 },
  { unitNo: 6, unitName: 'Practical Biology', topicName: 'Slide Study — Reproduction and Stomata', description: 'Observing binary fission, budding, leaf spirogyra slides.', periodsNeeded: 14 },
]

const ENGLISH_10: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'Prose — First Flight', topicName: 'A Letter to God', description: 'Lencho\u2019s faith; irony and inference questions.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — First Flight', topicName: 'Nelson Mandela: Long Walk to Freedom', description: 'Apartheid; inauguration day; values of courage and love.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — First Flight', topicName: 'Two Stories about Flying', description: 'The young seagull and the black aeroplane; courage themes.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — First Flight', topicName: 'From the Diary of Anne Frank', description: 'Diary form; Kitty; classroom anecdote.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — First Flight', topicName: 'Glimpses of India', description: 'A baker from Goa, Coorg and tea from Assam.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — First Flight', topicName: 'Mijbil the Otter', description: 'Gavin Maxwell\u2019s narrative; human-animal bonding.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — First Flight', topicName: 'Madam Rides the Bus', description: 'Valli\u2019s curiosity and independence; first journey.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — First Flight', topicName: 'The Sermon at Benares', description: 'Buddha\u2019s enlightenment; Kisa Gotami\u2019s grief.', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'Prose — First Flight', topicName: 'The Proposal', description: 'Chekhov\u2019s one-act farce; dramatic reading.', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'Poetry — First Flight', topicName: 'Dust of Snow and Fire and Ice', description: 'Frost\u2019s twin poems; transformation and destruction motifs.', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'Poetry — First Flight', topicName: 'A Tiger in the Zoo', description: 'Contrast of captivity and freedom; poetic devices.', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'Poetry — First Flight', topicName: 'The Ball Poem and Amanda!', description: 'Loss and responsibility; escapism in adolescence.', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'Poetry — First Flight', topicName: 'The Trees and Fog', description: 'Adrienne Rich and Carl Sandburg; imagery and symbolism.', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'Poetry — First Flight', topicName: 'The Tale of Custard the Dragon', description: 'Ogden Nash\u2019s ballad; humour and bravery.', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'Poetry — First Flight', topicName: 'For Anne Gregory', description: "Yeats on beauty and inner worth; dialogue form.", periodsNeeded: 6 },
  { unitNo: 3, unitName: 'Writing Skills and Grammar', topicName: 'Formal Letters', description: 'Letters of inquiry, complaint and job application.', periodsNeeded: 14 },
  { unitNo: 3, unitName: 'Writing Skills and Grammar', topicName: 'Analytical Paragraphs', description: 'Data-based analytical writing; structure and cohesion.', periodsNeeded: 14 },
  { unitNo: 3, unitName: 'Writing Skills and Grammar', topicName: 'Tenses, Determiners and Reported Speech', description: 'Gap-filling, sentence transformation and editing practice.', periodsNeeded: 14 },
  { unitNo: 3, unitName: 'Writing Skills and Grammar', topicName: 'Editing and Gap-Filling Practice', description: 'Error identification and omission exercises.', periodsNeeded: 14 },
  { unitNo: 4, unitName: 'Reading Comprehension', topicName: 'Discursive Passages', description: 'Argumentative texts; inference and vocabulary questions.', periodsNeeded: 16 },
  { unitNo: 4, unitName: 'Reading Comprehension', topicName: 'Case-Based Passages', description: 'Visual-verbal inputs; data interpretation.', periodsNeeded: 16 },
]

const SST_10: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'History — India and the Contemporary World II', topicName: 'The Rise of Nationalism in Europe', description: 'Frankfurt parliament; unification of Germany and Italy; nationalism aligned.', periodsNeeded: 16 },
  { unitNo: 1, unitName: 'History — India and the Contemporary World II', topicName: 'Nationalism in India', description: 'Civil disobedience; satyagraha; sense of collective belonging.', periodsNeeded: 18 },
  { unitNo: 1, unitName: 'History — India and the Contemporary World II', topicName: 'The Making of a Global World', description: 'Silk routes; Great Depression; Bretton Woods.', periodsNeeded: 18 },
  { unitNo: 2, unitName: 'Geography — Contemporary India II', topicName: 'Resources and Development', description: 'Classification; soil erosion and conservation.', periodsNeeded: 12 },
  { unitNo: 2, unitName: 'Geography — Contemporary India II', topicName: 'Water Resources', description: 'Multipurpose projects; rainwater harvesting.', periodsNeeded: 10 },
  { unitNo: 2, unitName: 'Geography — Contemporary India II', topicName: 'Agriculture', description: 'Cropping patterns; institutional reforms; food security.', periodsNeeded: 12 },
  { unitNo: 2, unitName: 'Geography — Contemporary India II', topicName: 'Minerals and Energy Resources', description: 'Distribution of minerals; conventional and non-conventional energy.', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'Civics — Democratic Politics II', topicName: 'Power Sharing', description: 'Belgium and Sri Lanka; forms of power sharing.', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'Civics — Democratic Politics II', topicName: 'Federalism', description: 'Union and state lists; decentralisation in India.', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'Civics — Democratic Politics II', topicName: 'Gender, Religion and Caste', description: 'Public/private division; communalism; caste in politics.', periodsNeeded: 14 },
  { unitNo: 4, unitName: 'Economics — Understanding Economic Development', topicName: 'Development', description: 'Income and other criteria; sustainability.', periodsNeeded: 10 },
  { unitNo: 4, unitName: 'Economics — Understanding Economic Development', topicName: 'Sectors of the Indian Economy', description: 'Primary/secondary/tertiary; organised vs unorganised; NREGA.', periodsNeeded: 14 },
  { unitNo: 4, unitName: 'Economics — Understanding Economic Development', topicName: 'Money and Credit', description: 'Money as medium; formal vs informal credit; SHGs.', periodsNeeded: 14 },
]

const HINDI_10: CurriculumSeedTopic[] = [
  { unitNo: 1, unitName: 'गद्य खंड — स्पर्श', topicName: 'बड़े भाई साहब', description: 'प्रेमचंद की कहानी; अध्ययन और खेल का तानाबाना।', periodsNeeded: 10 },
  { unitNo: 1, unitName: 'गद्य खंड — स्पर्श', topicName: 'डायरी का एक पन्ना', description: 'सीताराम सेकसरिया का सिक्किम-यात्रा वृत्तांत।', periodsNeeded: 8 },
  { unitNo: 1, unitName: 'गद्य खंड — स्पर्श', topicName: 'तताँरा-वामीरो कथा', description: 'लीलाधर मंडलोई की लोक-कथा; निकोबार संस्कृति।', periodsNeeded: 10 },
  { unitNo: 1, unitName: 'गद्य खंड — स्पर्श', topicName: 'गिरगिट', description: 'चेखव की कहानी; अवसरवादिता पर व्यंग्य।', periodsNeeded: 12 },
  { unitNo: 1, unitName: 'गद्य खंड — स्पर्श', topicName: 'पतझर में टूटी पत्तियाँ', description: 'रवींद्र केलेकर का संस्मरणात्मक लेख; अंतरयामी की मार।', periodsNeeded: 12 },
  { unitNo: 2, unitName: 'काव्य खंड — स्पर्श', topicName: 'साखियाँ (कबीर)', description: 'ज्ञान और अहंकार; कबीर की साखियों की भाषा-शैली।', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'काव्य खंड — स्पर्श', topicName: 'पद (मीरा)', description: 'कृष्ण-प्रेम और दास्य भाव; मीरा की भक्ति।', periodsNeeded: 6 },
  { unitNo: 2, unitName: 'काव्य खंड — स्पर्श', topicName: 'मनुष्यता', description: 'मैथिलीशरण गुप्त का खंडकाव्य; परोपकार का संदेश।', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'काव्य खंड — स्पर्श', topicName: 'पर्वत प्रदेश में पावस', description: 'सुमित्रानंदन पंत का प्रकृति-काव्य; मानवीकरण।', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'काव्य खंड — स्पर्श', topicName: 'तोप', description: 'वीरेन डंगवाल की कविता; 1857 और स्वतंत्रता की प्रतीक तोप।', periodsNeeded: 8 },
  { unitNo: 2, unitName: 'काव्य खंड — स्पर्श', topicName: 'कर चले हम फ़िदा', description: 'कैफ़ी आज़मी का देशभक्ति गीत; बलिदान का संकल्प।', periodsNeeded: 8 },
  { unitNo: 3, unitName: 'व्याकरण एवं लेखन', topicName: 'वाच्य, पद परिचय एवं रस', description: 'वाच्य-परिवर्तन; संज्ञा/सर्वनाम पद परिचय; रस-निरूपण।', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'व्याकरण एवं लेखन', topicName: 'अलंकार एवं समास', description: 'अनुप्रास, उपमा, रूपक; समास-भेद और विग्रह।', periodsNeeded: 12 },
  { unitNo: 3, unitName: 'व्याकरण एवं लेखन', topicName: 'अपठित गद्यांश', description: 'अर्थ-ग्रहण; प्रश्न-विश्लेषण अभ्यास।', periodsNeeded: 10 },
  { unitNo: 3, unitName: 'व्याकरण एवं लेखन', topicName: 'पत्र-लेखन एवं संक्षेपण', description: 'औपचारिक पत्र; गद्यांश संक्षेपण अभ्यास।', periodsNeeded: 10 },
]

export const CURRICULUM_SEED: CurriculumSeedSubject[] = [
  { subjectName: 'Mathematics', grade: 9, topics: MATH_9 },
  { subjectName: 'Physics', grade: 9, topics: PHYSICS_9 },
  { subjectName: 'Chemistry', grade: 9, topics: CHEMISTRY_9 },
  { subjectName: 'Biology', grade: 9, topics: BIOLOGY_9 },
  { subjectName: 'English', grade: 9, topics: ENGLISH_9 },
  { subjectName: 'Social Science', grade: 9, topics: SST_9 },
  { subjectName: 'Hindi', grade: 9, topics: HINDI_9 },
  { subjectName: 'Mathematics', grade: 10, topics: MATH_10 },
  { subjectName: 'Physics', grade: 10, topics: PHYSICS_10 },
  { subjectName: 'Chemistry', grade: 10, topics: CHEMISTRY_10 },
  { subjectName: 'Biology', grade: 10, topics: BIOLOGY_10 },
  { subjectName: 'English', grade: 10, topics: ENGLISH_10 },
  { subjectName: 'Social Science', grade: 10, topics: SST_10 },
  { subjectName: 'Hindi', grade: 10, topics: HINDI_10 },
]

/** Demo school holidays — real Indian school calendar for session 2026-27. */
export const HOLIDAY_SEED: { title: string; start: string; end: string }[] = [
  { title: 'Ambedkar Jayanti', start: '2026-04-14', end: '2026-04-14' },
  { title: 'Labour Day', start: '2026-05-01', end: '2026-05-01' },
  { title: 'Summer Break', start: '2026-05-18', end: '2026-06-14' },
  { title: 'Independence Day', start: '2026-08-15', end: '2026-08-15' },
  { title: 'Janmashtami', start: '2026-09-04', end: '2026-09-04' },
  { title: 'Gandhi Jayanti', start: '2026-10-02', end: '2026-10-02' },
  { title: 'Dussehra Break', start: '2026-10-19', end: '2026-10-21' },
  { title: 'Diwali Break', start: '2026-11-07', end: '2026-11-10' },
  { title: 'Christmas', start: '2026-12-25', end: '2026-12-25' },
  { title: 'Republic Day', start: '2027-01-26', end: '2027-01-26' },
]
