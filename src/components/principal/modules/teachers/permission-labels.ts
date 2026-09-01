/**
 * Permission label mapping — converts technical permission tokens
 * (like `view_assigned_classes`) into human-readable labels
 * (like "Can view assigned classes").
 *
 * Used in the Teacher Profile page so principals can understand
 * permissions instantly without reading developer-oriented tokens.
 */

export const PERMISSION_LABELS: Record<string, string> = {
  // Subject Teacher
  view_assigned_classes: 'Can view assigned classes',
  enter_subject_marks: 'Can enter marks',
  take_class_attendance: 'Can take attendance',
  view_own_timetable: 'Can view own timetable',

  // Class Teacher (additional)
  view_full_class_profile: 'Can view class profiles',
  enter_class_attendance: 'Can take class attendance',
  generate_marksheets: 'Can generate marksheets',
  view_parent_info: 'Can access parent details',
  view_student_behaviour: 'Can view student behaviour',
  recommend_promotion: 'Can recommend promotion',
  ptm_coordination: 'Can conduct PTM',

  // Examination Incharge
  manage_school_exams: 'Can manage exams',
  view_all_marks: 'Can view all marks',
  generate_report_cards: 'Can generate report cards',
  exam_proctoring_admin: 'Can manage exam proctoring',

  // Discipline Incharge
  manage_discipline: 'Can manage discipline',
  log_incidents: 'Can log incidents',
  issue_demerits: 'Can issue demerits',

  // Sports Incharge
  manage_sports: 'Can manage sports',
  sports_rosters: 'Can manage sports rosters',
  event_coordination: 'Can coordinate events',

  // House Master
  manage_house_activities: 'Can manage house activities',
  house_points_entry: 'Can enter house points',
  mentoring_lead: 'Can lead mentoring',

  // Lab Incharge
  manage_lab: 'Can manage labs',
  lab_inventory: 'Can manage lab inventory',
  safety_compliance: 'Can oversee safety compliance',

  // Library Incharge
  manage_library: 'Can manage library',
  book_issuance: 'Can issue books',
  library_catalog: 'Can manage catalog',

  // Cultural Coordinator
  manage_cultural: 'Can manage cultural events',
  announcements: 'Can make announcements',

  // Transport Incharge
  manage_transports: 'Can manage transport',
  view_bus_routes: 'Can view bus routes',
  transport_logs: 'Can view transport logs',

  // Timetable Coordinator
  manage_timetable: 'Can manage timetable',
  substitution_assignment: 'Can assign substitutions',

  // Vice Principal
  admin_broad_access: 'Broad admin access',
  view_all_teachers: 'Can view all teachers',
  approve_leaves: 'Can approve leaves',
  view_academic_analytics: 'Can view academic analytics',
}

/**
 * Convert a list of permission tokens to human-readable labels.
 * Unknown tokens fall back to a prettified version of the key.
 */
export function getPermissionLabels(tokens: string[]): string[] {
  return tokens.map((token) => {
    if (PERMISSION_LABELS[token]) return PERMISSION_LABELS[token]
    // Fallback: prettify snake_case to Title Case
    return token
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  })
}
