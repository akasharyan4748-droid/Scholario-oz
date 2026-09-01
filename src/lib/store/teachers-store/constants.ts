import type { PositionDefinition } from './types'

// Pre-defined System Positions
export const DEFAULT_POSITIONS: PositionDefinition[] = [
  {
    id: 'pos-subject-teacher',
    title: 'Subject Teacher',
    category: 'Academic',
    description: 'Teaches assigned subjects, marks attendance for period classes, submits student marks.',
    permissions: ['view_assigned_classes', 'enter_subject_marks', 'take_class_attendance', 'view_own_timetable'],
  },
  {
    id: 'pos-class-teacher',
    title: 'Class Teacher',
    category: 'Academic',
    description: 'Primary custodian for class roster, attendance, behaviour records, marksheets & parent liaison.',
    permissions: [
      'view_assigned_classes', 'enter_subject_marks', 'take_class_attendance', 'view_own_timetable',
      'view_full_class_profile', 'enter_class_attendance', 'generate_marksheets', 'view_parent_info',
      'view_student_behaviour', 'recommend_promotion', 'ptm_coordination',
    ],
  },
  {
    id: 'pos-exam-incharge',
    title: 'Examination Incharge',
    category: 'Administrative',
    description: 'Oversees school-wide exam schedules, seating arrangements, invigilation and proctoring.',
    permissions: ['manage_school_exams', 'view_all_marks', 'generate_report_cards', 'exam_proctoring_admin'],
  },
  {
    id: 'pos-discipline-incharge',
    title: 'Discipline Incharge',
    category: 'Administrative',
    description: 'Monitors student conduct, handles disciplinary actions, issues merits and demerits.',
    permissions: ['manage_discipline', 'log_incidents', 'issue_demerits', 'view_student_behaviour'],
  },
  {
    id: 'pos-sports-incharge',
    title: 'Sports Incharge',
    category: 'Co-Curricular',
    description: 'Coordinates physical education, intra-school sports tournaments, and athletic squads.',
    permissions: ['manage_sports', 'sports_rosters', 'event_coordination'],
  },
  {
    id: 'pos-house-master',
    title: 'House Master / Mistress',
    category: 'Co-Curricular',
    description: 'Leads student house competitions, mentorship, and house points allocation.',
    permissions: ['manage_house_activities', 'house_points_entry', 'mentoring_lead'],
  },
  {
    id: 'pos-lab-incharge',
    title: 'Laboratory Incharge',
    category: 'Academic',
    description: 'Manages science & IT lab equipment, safety compliance, and lab schedules.',
    permissions: ['manage_lab', 'lab_inventory', 'safety_compliance'],
  },
  {
    id: 'pos-library-incharge',
    title: 'Library Incharge',
    category: 'Administrative',
    description: 'Manages book catalog, borrowing logs, reading challenges, and digital library resources.',
    permissions: ['manage_library', 'book_issuance', 'library_catalog'],
  },
  {
    id: 'pos-cultural-coordinator',
    title: 'Cultural Coordinator',
    category: 'Co-Curricular',
    description: 'Organizes school festivals, annual functions, performing arts programs, and competitions.',
    permissions: ['manage_cultural', 'event_coordination', 'announcements'],
  },
  {
    id: 'pos-transport-incharge',
    title: 'Transport Incharge',
    category: 'Administrative',
    description: 'Monitors bus routes, driver rosters, student transport attendance, and route safety.',
    permissions: ['manage_transports', 'view_bus_routes', 'transport_logs'],
  },
  {
    id: 'pos-timetable-coordinator',
    title: 'Time Table Coordinator',
    category: 'Administrative',
    description: 'Designs and publishes master class schedules, teacher substitution, and period allocations.',
    permissions: ['manage_timetable', 'substitution_assignment', 'view_own_timetable'],
  },
  {
    id: 'pos-vice-principal',
    title: 'Vice Principal',
    category: 'Management',
    description: 'Broad administrative oversight across academics, staff evaluation, discipline, and policies.',
    permissions: [
      'admin_broad_access', 'view_all_teachers', 'manage_timetable', 'manage_school_exams',
      'view_all_marks', 'manage_discipline', 'approve_leaves', 'view_academic_analytics',
    ],
  },
]
