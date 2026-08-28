'use client'

/**
 * application-templates — school-oriented starting points for the Form
 * Builder (spec #11). Templates ACCELERATE creation only: every field,
 * section and setting they prefill remains fully editable. A template is a
 * pure data shape — no behaviour, no side effects.
 */

import type {
  ApplicationFormField, ApplicationCategory, FormSectionMeta,
  PaymentModeConfig, ParticipationMode,
} from './applications-store'

export interface ApplicationTemplate {
  id: string
  name: string
  description: string
  category: ApplicationCategory
  participation: ParticipationMode
  paymentMode: PaymentModeConfig
  paymentAmount: number
  paymentFeeHeadLabel: string
  guardianConsentRequired: boolean
  teacherApprovalRequired: boolean
  /** Deadline offset in days from creation (sensible default). */
  deadlineInDays: number
  sections: FormSectionMeta[]
  fields: ApplicationFormField[]
}

let seq = 0
const fid = (p: string) => `${p}-${(++seq).toString(36)}${Date.now().toString(36).slice(-4)}`

/** Fresh ids every time a template is instantiated (two forms from the same
 *  template must never share field ids — answers are keyed by field id). */
export function instantiateTemplate(t: ApplicationTemplate): {
  fields: ApplicationFormField[]
  sections: FormSectionMeta[]
} {
  const idMap = new Map<string, string>()
  const fields = t.fields.map((f) => {
    const id = fid('fld')
    idMap.set(f.id, id)
    return { ...structuredClone(f), id }
  })
  // Re-point conditional logic at the NEW ids.
  for (const f of fields) {
    if (f.visibleWhen) {
      f.visibleWhen = {
        ...f.visibleWhen,
        fieldId: idMap.get(f.visibleWhen.fieldId) ?? f.visibleWhen.fieldId,
      }
    }
  }
  return {
    fields,
    sections: structuredClone(t.sections),
  }
}

export const APPLICATION_TEMPLATES: ApplicationTemplate[] = [
  {
    id: 'tpl-trip',
    name: 'Trip / Picnic Permission',
    description: 'Educational trip or picnic — participation choice, travel & medical info, guardian consent.',
    category: 'Tour',
    participation: 'Optional',
    paymentMode: 'Required',
    paymentAmount: 2500,
    paymentFeeHeadLabel: 'Educational Trip',
    guardianConsentRequired: true,
    teacherApprovalRequired: false,
    deadlineInDays: 10,
    sections: [
      { id: 'sec-participation', title: 'Participation' },
      { id: 'sec-travel', title: 'Travel & Dietary' },
      { id: 'sec-medical', title: 'Medical Information' },
      { id: 'sec-consent', title: 'Guardian Consent' },
    ],
    fields: [
      { id: 'tpl-trip-join', type: 'yesno', label: 'Will your ward participate in this trip?', helpText: 'Choose carefully — later sections adapt to this answer.', required: true, sectionId: 'sec-participation' },
      { id: 'tpl-trip-tshirt', type: 'text', label: 'T-shirt size', placeholder: 'e.g. 32 / M', sectionId: 'sec-participation', required: false, visibleWhen: { fieldId: 'tpl-trip-join', equals: ['Yes'] } },
      { id: 'tpl-trip-transport', type: 'radio', label: 'Transport preference', options: ['School Bus', 'Own Arrangement'], required: true, sectionId: 'sec-travel', visibleWhen: { fieldId: 'tpl-trip-join', equals: ['Yes'] } },
      { id: 'tpl-trip-dietary', type: 'multiselect', label: 'Dietary requirements', options: ['Vegetarian', 'Jain', 'No Nuts', 'No Lactose', 'Other'], sectionId: 'sec-travel', required: false, visibleWhen: { fieldId: 'tpl-trip-join', equals: ['Yes'] } },
      { id: 'tpl-trip-allergy', type: 'longtext', label: 'Allergies or medical conditions the school must know about', placeholder: 'List medicines, dosage and emergency instructions…', sectionId: 'sec-medical', required: false, visibleWhen: { fieldId: 'tpl-trip-join', equals: ['Yes'] } },
      { id: 'tpl-trip-doctor', type: 'phone', label: 'Family doctor — name & number', placeholder: 'Dr. Sharma · 98xxx-xxxxx', sectionId: 'sec-medical', required: false, visibleWhen: { fieldId: 'tpl-trip-join', equals: ['Yes'] } },
      { id: 'tpl-trip-consent', type: 'consent', label: 'Guardian consent', helpText: 'I permit my ward to join the trip and confirm the medical information above is complete.', required: true, sectionId: 'sec-consent', visibleWhen: { fieldId: 'tpl-trip-join', equals: ['Yes'] } },
    ],
  },
  {
    id: 'tpl-event',
    name: 'Event Registration',
    description: 'School event signup — attendee count, preferences and optional notes.',
    category: 'Event',
    participation: 'Optional',
    paymentMode: 'None',
    paymentAmount: 0,
    paymentFeeHeadLabel: 'Event Fee',
    guardianConsentRequired: false,
    teacherApprovalRequired: false,
    deadlineInDays: 7,
    sections: [
      { id: 'sec-attend', title: 'Attendance' },
      { id: 'sec-notes', title: 'Notes' },
    ],
    fields: [
      { id: 'tpl-ev-attend', type: 'yesno', label: 'Will you attend the event?', required: true, sectionId: 'sec-attend' },
      { id: 'tpl-ev-guests', type: 'number', label: 'Number of accompanying family members', min: 0, max: 6, integerOnly: true, sectionId: 'sec-attend', required: false, visibleWhen: { fieldId: 'tpl-ev-attend', equals: ['Yes'] } },
      { id: 'tpl-ev-note', type: 'longtext', label: 'Anything the organisers should know?', placeholder: 'Accessibility needs, questions…', sectionId: 'sec-notes', required: false, visibleWhen: { fieldId: 'tpl-ev-attend', equals: ['Yes'] } },
    ],
  },
  {
    id: 'tpl-workshop',
    name: 'Workshop Registration',
    description: 'Workshop/skill programme enrolment with experience level and material kit choice.',
    category: 'Workshop',
    participation: 'Optional',
    paymentMode: 'Required',
    paymentAmount: 1000,
    paymentFeeHeadLabel: 'Workshop Fee',
    guardianConsentRequired: false,
    teacherApprovalRequired: false,
    deadlineInDays: 12,
    sections: [
      { id: 'sec-level', title: 'Experience' },
      { id: 'sec-kit', title: 'Material Kit' },
    ],
    fields: [
      { id: 'tpl-ws-level', type: 'dropdown', label: 'Experience level', options: ['Beginner', 'Intermediate', 'Advanced'], searchable: false, required: true, sectionId: 'sec-level' },
      { id: 'tpl-ws-exp', type: 'longtext', label: 'Briefly describe prior experience', placeholder: 'Courses, projects, competitions…', required: false, sectionId: 'sec-level' },
      { id: 'tpl-ws-kit', type: 'radio', label: 'Material kit', options: ['Standard kit (included)', 'Premium kit (+₹300)'], required: true, sectionId: 'sec-kit' },
      { id: 'tpl-ws-tc', type: 'terms', label: 'Workshop rules acceptance', helpText: 'Attendance in all sessions is required to receive the certificate.', required: true, sectionId: 'sec-kit' },
    ],
  },
  {
    id: 'tpl-consent',
    name: 'Parent Consent / Declaration',
    description: 'Generic guardian consent with declaration and digital signature.',
    category: 'Activity',
    participation: 'Mandatory',
    paymentMode: 'None',
    paymentAmount: 0,
    paymentFeeHeadLabel: 'Consent',
    guardianConsentRequired: true,
    teacherApprovalRequired: false,
    deadlineInDays: 5,
    sections: [
      { id: 'sec-consent2', title: 'Consent' },
      { id: 'sec-declare', title: 'Declaration' },
    ],
    fields: [
      { id: 'tpl-pc-notice', type: 'notice', label: 'Please read carefully', blockText: 'This consent covers the activity described in the form notice above. Submitting this form is mandatory for every student of the targeted classes.', sectionId: 'sec-consent2', required: false },
      { id: 'tpl-pc-consent', type: 'consent', label: 'Guardian consent', required: true, sectionId: 'sec-consent2' },
      { id: 'tpl-pc-declare', type: 'declaration', label: 'Declaration', helpText: 'I declare the information provided is true to the best of my knowledge.', required: true, sectionId: 'sec-declare' },
      { id: 'tpl-pc-sign', type: 'signature', label: 'Guardian signature', signatureRole: 'Guardian', required: true, sectionId: 'sec-declare' },
    ],
  },
  {
    id: 'tpl-competition',
    name: 'Competition Registration',
    description: 'Competitive event entry — category selection, portfolio/document upload.',
    category: 'Competition',
    participation: 'Optional',
    paymentMode: 'None',
    paymentAmount: 0,
    paymentFeeHeadLabel: 'Entry Fee',
    guardianConsentRequired: false,
    teacherApprovalRequired: true,
    deadlineInDays: 14,
    sections: [
      { id: 'sec-entry', title: 'Entry Details' },
      { id: 'sec-docs', title: 'Documents' },
    ],
    fields: [
      { id: 'tpl-cm-cat', type: 'dropdown', label: 'Competition category', options: ['Quiz', 'Debate', 'Painting', 'Science Fair', 'Coding'], searchable: true, required: true, sectionId: 'sec-entry' },
      { id: 'tpl-cm-team', type: 'yesno', label: 'Participating as a team?', required: true, sectionId: 'sec-entry' },
      { id: 'tpl-cm-teamnames', type: 'longtext', label: 'Team member names (one per line)', placeholder: 'Name & class of each teammate…', required: false, sectionId: 'sec-entry', visibleWhen: { fieldId: 'tpl-cm-team', equals: ['Yes'] } },
      { id: 'tpl-cm-doc', type: 'supporting-doc', label: 'Supporting document / previous work', helpText: 'PDF or images, max 5 MB each.', maxFiles: 3, maxSizeMb: 5, required: false, sectionId: 'sec-docs' },
      { id: 'tpl-cm-declare', type: 'declaration', label: 'Fair-play declaration', required: true, sectionId: 'sec-docs' },
    ],
  },
  {
    id: 'tpl-activity',
    name: 'Activity / Club Enrollment',
    description: 'Club or activity enrolment with preference ranking and weekly slot choice.',
    category: 'Activity',
    participation: 'Optional',
    paymentMode: 'None',
    paymentAmount: 0,
    paymentFeeHeadLabel: 'Activity Fee',
    guardianConsentRequired: false,
    teacherApprovalRequired: false,
    deadlineInDays: 8,
    sections: [
      { id: 'sec-pref', title: 'Preferences' },
      { id: 'sec-slot', title: 'Weekly Slot' },
    ],
    fields: [
      { id: 'tpl-ac-club', type: 'dropdown', label: 'Preferred club', options: ['Robotics', 'Drama', 'Eco Club', 'Astronomy', 'Chess'], searchable: true, required: true, sectionId: 'sec-pref' },
      { id: 'tpl-ac-second', type: 'dropdown', label: 'Second preference', options: ['Robotics', 'Drama', 'Eco Club', 'Astronomy', 'Chess'], required: false, sectionId: 'sec-pref' },
      { id: 'tpl-ac-why', type: 'longtext', label: 'Why this club?', placeholder: 'One or two lines…', required: false, sectionId: 'sec-pref' },
      { id: 'tpl-ac-slot', type: 'radio', label: 'Preferred weekly slot', options: ['Tue 3–4 PM', 'Thu 3–4 PM', 'Sat 9–10 AM'], required: true, sectionId: 'sec-slot' },
    ],
  },
  {
    id: 'tpl-document',
    name: 'Certificate / Document Request',
    description: 'Request official documents — type, purpose, delivery mode.',
    category: 'Certificate',
    participation: 'Optional',
    paymentMode: 'Optional',
    paymentAmount: 50,
    paymentFeeHeadLabel: 'Document Processing',
    guardianConsentRequired: false,
    teacherApprovalRequired: false,
    deadlineInDays: 6,
    sections: [
      { id: 'sec-req', title: 'Request Details' },
      { id: 'sec-delivery', title: 'Delivery' },
    ],
    fields: [
      { id: 'tpl-dc-type', type: 'dropdown', label: 'Document type', options: ['Bonafide Certificate', 'Transfer Certificate', 'Migration Certificate', 'Character Certificate', 'ID Card Duplicate', 'Marksheet Duplicate'], searchable: true, required: true, sectionId: 'sec-req' },
      { id: 'tpl-dc-purpose', type: 'longtext', label: 'Purpose of the request', placeholder: 'e.g. school transfer, scholarship application…', required: true, sectionId: 'sec-req' },
      { id: 'tpl-dc-copies', type: 'number', label: 'Number of copies', min: 1, max: 5, integerOnly: true, required: true, sectionId: 'sec-req' },
      { id: 'tpl-dc-mode', type: 'radio', label: 'Delivery mode', options: ['Collect from office', 'Send with student'], required: true, sectionId: 'sec-delivery' },
    ],
  },
  {
    id: 'tpl-donation',
    name: 'Donation / Contribution',
    description: 'Voluntary contribution drive with amount choice and acknowledgement.',
    category: 'Donation',
    participation: 'Optional',
    paymentMode: 'Optional',
    paymentAmount: 500,
    paymentFeeHeadLabel: 'Contribution',
    guardianConsentRequired: false,
    teacherApprovalRequired: false,
    deadlineInDays: 15,
    sections: [
      { id: 'sec-contribute', title: 'Contribution' },
      { id: 'sec-ack', title: 'Acknowledgement' },
    ],
    fields: [
      { id: 'tpl-dn-join', type: 'yesno', label: 'Would you like to contribute?', required: true, sectionId: 'sec-contribute' },
      { id: 'tpl-dn-amount', type: 'number', label: 'Contribution amount (₹)', min: 100, max: 50000, integerOnly: true, placeholder: 'e.g. 500', required: true, sectionId: 'sec-contribute', visibleWhen: { fieldId: 'tpl-dn-join', equals: ['Yes'] } },
      { id: 'tpl-dn-anon', type: 'yesno', label: 'Keep my contribution anonymous', required: false, sectionId: 'sec-contribute', visibleWhen: { fieldId: 'tpl-dn-join', equals: ['Yes'] } },
      { id: 'tpl-dn-msg', type: 'longtext', label: 'Message of support (optional)', placeholder: 'A few words of encouragement…', required: false, sectionId: 'sec-ack', visibleWhen: { fieldId: 'tpl-dn-join', equals: ['Yes'] } },
    ],
  },
]
