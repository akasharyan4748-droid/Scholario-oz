/**
 * downloads-content — real, renderable content for the Downloads library's
 * static catalogue (official forms, office templates, reports).
 *
 * Every static document now carries an actual document body (sections with
 * labelled fields, optional data table, declaration, signature blocks), so:
 *   · the Preview drawer renders the REAL document (never a bare logo), and
 *   · Download / Print produce a genuine branded A4 document file.
 *
 * Content is data-driven: ONE renderer (downloads/static-doc-preview.tsx)
 * covers all documents. School branding is injected at render time from
 * School Settings → General.
 */

// ─── Types ────────────────────────────────────────────────────────────

export interface StaticDocSection {
  heading?: string
  /** Labelled blank fields — rendered as ruled fill-in lines. */
  fields: string[]
}

export interface StaticDocTable {
  columns: string[]
  rows: string[][]
}

export interface StaticDocContent {
  /** Document title as printed (e.g. 'ADMISSION APPLICATION FORM'). */
  docTitle: string
  /** Session / reference line under the title. */
  subtitle?: string
  /** Short guidance line (kept concise — no paragraphs). */
  instructions?: string
  sections: StaticDocSection[]
  table?: StaticDocTable
  /** Declaration / compliance line before signatures. */
  declaration?: string
  /** Signature captions, evenly spaced across the footer. */
  signatures?: string[]
  /** Small print at the very bottom. */
  notes?: string
}

// ─── Content per static document id ───────────────────────────────────

const SESSION_NOTE = 'For the academic session 2026–2027'

export const STATIC_DOC_CONTENT: Record<string, StaticDocContent> = {
  // ── Official Forms ──────────────────────────────────────────────────
  'doc-form-admission': {
    docTitle: 'ADMISSION APPLICATION FORM',
    subtitle: SESSION_NOTE,
    instructions: 'Complete in block letters. Attach attested copies of all supporting documents.',
    sections: [
      {
        heading: 'Student Particulars',
        fields: ['Student Name (as per birth certificate)', 'Date of Birth', 'Gender', 'Blood Group', 'Nationality', 'Category', 'Mother Tongue', 'Religion'],
      },
      {
        heading: 'Parent / Guardian Particulars',
        fields: ["Father's Name", "Father's Occupation", "Father's Mobile", "Mother's Name", "Mother's Occupation", "Mother's Mobile", 'Residential Address', 'Office Address'],
      },
      {
        heading: 'Academic Background',
        fields: ['Previous School', 'Class Last Attended', 'Medium of Instruction', 'Board / Affiliation', 'Percentage in Last Exam', 'Co-curricular Achievements'],
      },
    ],
    table: {
      columns: ['Document Submitted', 'Attested Copy', 'Original Verified'],
      rows: [
        ['Birth Certificate', 'Yes / No', 'Yes / No'],
        ['Transfer Certificate', 'Yes / No', 'Yes / No'],
        ['Previous Report Card', 'Yes / No', 'Yes / No'],
        ['Aadhaar Card', 'Yes / No', 'Yes / No'],
        ['Address Proof', 'Yes / No', 'Yes / No'],
      ],
    },
    declaration: 'I hereby declare that the information furnished above is true to the best of my knowledge. I have read the school’s admission policy and fee structure and agree to abide by them.',
    signatures: ['Parent / Guardian', 'Admission In-charge', 'Principal'],
    notes: 'Incomplete forms will not be processed. Submission of the form does not guarantee admission.',
  },
  'doc-form-registration': {
    docTitle: 'PRE-ADMISSION REGISTRATION FORM',
    subtitle: SESSION_NOTE,
    instructions: 'Registration is valid for one academic session only.',
    sections: [
      {
        heading: 'Registration Details',
        fields: ['Registration No. (Office Use)', 'Date of Registration', 'Class Sought', 'Second Preference (Optional)'],
      },
      {
        heading: 'Student Details',
        fields: ['Student Name', 'Date of Birth', 'Age as on 31 March', 'Gender'],
      },
      {
        heading: 'Contact Details',
        fields: ["Parent's Name", 'Mobile Number', 'Email Address', 'Residential Address'],
      },
    ],
    declaration: 'I understand that registration does not guarantee admission and the registration fee is non-refundable.',
    signatures: ['Parent / Guardian', 'Registrar'],
    notes: 'Registration fee: ₹500 (payable at the school accounts office).',
  },
  'doc-form-prospectus': {
    docTitle: 'SCHOOL PROSPECTUS',
    subtitle: SESSION_NOTE,
    instructions: 'Overview of the school, curriculum and facilities.',
    sections: [
      {
        heading: 'About the School',
        fields: ['Affiliation', 'Established', 'Campus', 'Medium of Instruction', 'Student : Teacher Ratio', 'School Timing'],
      },
      {
        heading: 'Academic Programme',
        fields: ['Pre-Primary Curriculum', 'Primary Curriculum (I–V)', 'Middle Curriculum (VI–VIII)', 'Secondary (IX–X)', 'Senior Secondary Streams (XI–XII)'],
      },
      {
        heading: 'Facilities',
        fields: ['Science Laboratories', 'Computer Laboratories', 'Library', 'Sports Complex', 'Transport Fleet', 'Medical Room', 'Counselling Cell'],
      },
    ],
    table: {
      columns: ['Class Band', 'Tuition (Annual)', 'One-time Charges', 'Transport (Monthly)'],
      rows: [
        ['Pre-Primary', '₹ 30,000', '₹ 8,000', '₹ 500'],
        ['Primary (I–V)', '₹ 30,000', '₹ 8,000', '₹ 500'],
        ['Middle (VI–VIII)', '₹ 30,000', '₹ 8,000', '₹ 500'],
        ['Secondary (IX–X)', '₹ 36,000', '₹ 10,000', '₹ 500'],
        ['Senior (XI–XII)', '₹ 48,000', '₹ 12,000', '₹ 500'],
      ],
    },
    signatures: ['Principal'],
    notes: 'Fee structure indicative — the current signed schedule prevails.',
  },
  'doc-form-transport': {
    docTitle: 'TRANSPORT APPLICATION FORM',
    subtitle: 'Bus Service Enrolment',
    instructions: 'One form per student. Routes are subject to seat availability.',
    sections: [
      {
        heading: 'Student Details',
        fields: ['Student Name', 'Admission No.', 'Class & Section', 'Parent Contact'],
      },
      {
        heading: 'Pickup & Drop',
        fields: ['Residential Address / Landmark', 'Preferred Route (see route chart)', 'Pickup Point', 'Alternate Pickup Point (if any)'],
      },
      {
        heading: 'Safety & Medical',
        fields: ['Emergency Contact', 'Medical Conditions (if any)', 'Authorized Alternate Escort'],
      },
    ],
    table: {
      columns: ['Route No.', 'Main Stops', 'Est. Pickup', 'Est. Drop'],
      rows: [
        ['R-1', 'Sector 14 · Sector 15 · Sector 21', '07:20', '14:35'],
        ['R-2', 'DLF Phase 3 · Cyber Hub · Sector 24', '07:25', '14:40'],
        ['R-3', 'Sushant Lok · Sector 46', '07:30', '14:45'],
        ['R-4', 'Palam Vihar · Sector 23', '07:15', '14:35'],
        ['R-5', 'Sector 56 · Golf Course Road', '07:25', '14:40'],
      ],
    },
    declaration: 'I agree to the transport rules and understand that route/timing changes may occur during the session.',
    signatures: ['Parent / Guardian', 'Transport In-charge', 'Principal'],
    notes: 'Transport fee is billed monthly with the tuition invoice.',
  },
  'doc-form-hostel': {
    docTitle: 'HOSTEL APPLICATION FORM',
    subtitle: 'Boarding Facility Admission',
    sections: [
      {
        heading: 'Student Details',
        fields: ['Student Name', 'Admission No.', 'Class & Section', 'Date of Birth'],
      },
      {
        heading: 'Boarding Requirement',
        fields: ['Type Required (Weekly / Full)', 'Preferred Sharing (2/3/4-bed)', 'From Session', 'Local Guardian Name & Address'],
      },
      {
        heading: 'Health & Medical',
        fields: ['Blood Group', 'Allergies', 'Chronic Conditions', 'Family Physician', 'Medical Insurance Policy No.'],
      },
    ],
    table: {
      columns: ['Item', 'Provided by School', 'Provided by Parent'],
      rows: [
        ['Bed & Mattress', '✓', '—'],
        ['Bedding & Pillow', '—', '✓'],
        ['Study Table & Chair', '✓', '—'],
        ['Locker', '✓', '—'],
        ['Toiletries', '—', '✓'],
      ],
    },
    declaration: 'I have read the hostel rules and discipline policy and undertake that my ward will abide by them.',
    signatures: ['Parent / Guardian', 'Hostel Warden', 'Principal'],
  },
  'doc-form-medical': {
    docTitle: 'MEDICAL DECLARATION FORM',
    subtitle: 'Student Health & Emergency Information',
    instructions: 'Mandatory for all students; update immediately on any change.',
    sections: [
      {
        heading: 'Student Details',
        fields: ['Student Name', 'Admission No.', 'Class & Section', 'Date of Birth', 'Blood Group'],
      },
      {
        heading: 'Medical History',
        fields: ['Known Allergies', 'Asthma / Respiratory', 'Cardiac Condition', 'Diabetes', 'Seizures / Epilepsy', 'Surgical History', 'Current Medication'],
      },
      {
        heading: 'Emergency Contacts',
        fields: ["Father's Mobile", "Mother's Mobile", 'Family Physician & Phone', 'Preferred Hospital'],
      },
    ],
    declaration: 'I authorize the school medical staff to provide first-aid and seek emergency medical treatment for my ward when required.',
    signatures: ['Parent / Guardian', 'School Medical Officer'],
    notes: 'Information is kept confidential and used only for student welfare.',
  },
  'doc-form-sports': {
    docTitle: 'SPORTS PARTICIPATION FORM',
    subtitle: 'Inter-School & District Events',
    sections: [
      {
        heading: 'Student Details',
        fields: ['Student Name', 'Admission No.', 'Class & Section', 'Date of Birth', 'Age Group'],
      },
      {
        heading: 'Event Details',
        fields: ['Sport / Discipline', 'Event Level', 'Team / Individual', 'Coach In-charge', 'Venue', 'Event Dates'],
      },
      {
        heading: 'Fitness Declaration',
        fields: ['Physically Fit (Yes / No)', 'Restrictions (if any)', 'Medical Clearance Attached (Yes / No)'],
      },
    ],
    declaration: 'I grant permission for my ward to participate in the above event and travel with the school team. I understand the inherent risks of sporting activity.',
    signatures: ['Parent / Guardian', 'Coach', 'Sports In-charge'],
  },
  'doc-form-examination': {
    docTitle: 'EXAMINATION ENTRY FORM',
    subtitle: 'Internal / Board Examination Registration',
    sections: [
      {
        heading: 'Candidate Details',
        fields: ['Student Name', 'Admission No.', 'Class & Section', 'Roll No.', 'Board Registration No. (if board exam)'],
      },
      {
        heading: 'Examination Details',
        fields: ['Examination', 'Session', 'Subjects Offered (list in order)', 'Optional / Elective'],
      },
      {
        heading: 'Undertaking',
        fields: ['Dues Cleared (Yes / No)', 'Attendance ≥ 75% (Yes / No)', 'Hall Ticket Issued (Office Use)'],
      },
    ],
    table: {
      columns: ['Subject', 'Max Marks', 'Pass Marks', 'Practical', 'Exam Fee'],
      rows: [
        ['English', '100', '33', '—', '₹ 100'],
        ['Mathematics', '100', '33', '—', '₹ 100'],
        ['Science', '100', '33', 'Included', '₹ 150'],
        ['Social Science', '100', '33', '—', '₹ 100'],
        ['Second Language', '100', '33', '—', '₹ 100'],
      ],
    },
    declaration: 'I declare that I have filled the subject options correctly and understood the examination rules of the school / board.',
    signatures: ['Candidate', 'Parent / Guardian', 'Examination In-charge'],
  },

  // ── Templates ────────────────────────────────────────────────────────
  'doc-tpl-fee-receipt': {
    docTitle: 'FEE RECEIPT — MASTER TEMPLATE',
    subtitle: 'Accounts Office · Triplicate (Office / Student / Bank)',
    sections: [
      {
        heading: 'Receipt Details',
        fields: ['Receipt No.', 'Date', 'Payment Mode (Cash / Cheque / Online)', 'Cheque / Reference No.', 'Bank & Branch'],
      },
      {
        heading: 'Student Details',
        fields: ['Student Name', 'Admission No.', 'Class & Section', 'Parent Mobile'],
      },
    ],
    table: {
      columns: ['Fee Head', 'Period', 'Gross', 'Discount', 'Net Amount'],
      rows: [
        ['Tuition Fee', 'Apr–Mar', '₹ 36,000', '₹ —', '₹ 36,000'],
        ['Transport Fee', 'Apr–Mar', '₹ 6,000', '₹ —', '₹ 6,000'],
        ['Activity Fee', 'Annual', '₹ 2,000', '₹ —', '₹ 2,000'],
        ['Exam Fee', 'Per Exam', '₹ 1,500', '₹ —', '₹ 1,500'],
        ['', '', 'Total', '', '₹ 45,500'],
      ],
    },
    signatures: ['Cashier', 'Accounts In-charge', 'Parent Copy'],
    notes: 'Fee once paid is non-refundable except caution money. Keep this receipt for the session.',
  },
  'doc-tpl-id-card': {
    docTitle: 'STUDENT IDENTITY CARD — MASTER TEMPLATE',
    subtitle: 'Front / Back layout · Session ' + '2026–2027',
    sections: [
      {
        heading: 'Front Side — Fields',
        fields: ['School Name & Crest', 'Student Photograph (35 × 45 mm)', 'Student Name', 'Class & Section', 'Roll No.', 'Admission No.', 'Blood Group', 'Valid Upto'],
      },
      {
        heading: 'Back Side — Fields',
        fields: ["Father's Name", 'Mother’s Name', 'Residential Address', 'Parent Contact', 'Transport Route', 'House', 'School Address & Helpline'],
      },
    ],
    table: {
      columns: ['Card Spec', 'Value'],
      rows: [
        ['Dimensions', '54 × 86 mm (CR80)'],
        ['Material', 'PVC 0.76 mm'],
        ['Photo Area', '35 × 45 mm, white bg'],
        ['Colour Scheme', 'School brand'],
        ['Barcode / QR', 'Admission No. encoded'],
      ],
    },
    signatures: ['Principal'],
    notes: 'Cards are issued by the office; loss incurs a ₹100 re-issue charge.',
  },
  'doc-tpl-salary-slip': {
    docTitle: 'SALARY SLIP — MASTER TEMPLATE',
    subtitle: 'Payroll · For the month of ________ 20__',
    sections: [
      {
        heading: 'Employee Details',
        fields: ['Employee Name', 'Employee Code', 'Designation', 'Department', 'PAN', 'UAN / PF No.', 'Bank Account No.', 'Bank & IFSC'],
      },
    ],
    table: {
      columns: ['Earnings', 'Amount (₹)', 'Deductions', 'Amount (₹)'],
      rows: [
        ['Basic', '——', 'Provident Fund', '——'],
        ['House Rent Allowance', '——', 'Professional Tax', '——'],
        ['Transport Allowance', '——', 'TDS', '——'],
        ['Special Allowance', '——', 'Group Insurance', '——'],
        ['Arrears / Bonus', '——', 'Other Deductions', '——'],
        ['Gross Earnings', '——', 'Total Deductions', '——'],
      ],
    },
    declaration: 'Net Pay for the month: ₹ ____________ (Rupees ______________________________ only).',
    signatures: ['Accounts Officer', 'Employee Copy', 'Principal'],
    notes: 'Computer-generated slip; discrepancies to be reported within 7 days.',
  },
  'doc-tpl-tc-format': {
    docTitle: 'TRANSFER CERTIFICATE — OFFICIAL FORMAT',
    subtitle: 'As prescribed by the Board',
    sections: [
      {
        heading: 'Student Particulars',
        fields: ['Admission No. in School', 'Name (in full)', 'Mother’s Name', "Father's Name", 'Nationality', 'Whether SC / ST / OBC', 'Date of Birth (in figures)', 'Date of Birth (in words)', 'Date of First Admission'],
      },
      {
        heading: 'Academic Record',
        fields: ['Class in which the Student Studied Last', 'Class up to which Studied', 'Month up to which Studied', 'Subjects Offered', 'Result (Promoted / Detained)', 'Last Fee Month Paid'],
      },
      {
        heading: 'Conduct & Withdrawal',
        fields: ['Conduct & Character', 'Date of Application for TC', 'Date of Issue of TC', 'Reason for Leaving', 'Any Other Remarks'],
      },
    ],
    declaration: 'Certified that the above information is in accordance with the school register.',
    signatures: ['Class Teacher', 'Registrar / Office', 'Principal (with seal)'],
    notes: 'TC is issued within 7 working days of application. Fee dues must be cleared.',
  },
  'doc-tpl-fee-structure': {
    docTitle: 'CLASS-WISE FEE STRUCTURE',
    subtitle: SESSION_NOTE,
    instructions: 'Schedule approved by the Managing Committee.',
    table: {
      columns: ['Fee Head', 'Pre-Primary', 'I–V', 'VI–VIII', 'IX–X', 'XI–XII'],
      rows: [
        ['Admission Fee (one-time)', '₹ 8,000', '₹ 8,000', '₹ 8,000', '₹ 10,000', '₹ 12,000'],
        ['Tuition Fee (annual)', '₹ 30,000', '₹ 30,000', '₹ 30,000', '₹ 36,000', '₹ 48,000'],
        ['Management & Maintenance', '₹ 500', '₹ 500', '₹ 500', '₹ 500', '₹ 500'],
        ['Registration Fee (entry yrs)', '—', '—', '—', '₹ 300', '₹ 300'],
        ['Board Form Fee (X / XII)', '—', '—', '—', '₹ 1,500', '₹ 1,500'],
        ['Stream Practicals (PCM/PCB)', '—', '—', '—', '—', '₹ 600 / 900'],
        ['Transport (monthly, optional)', '₹ 500', '₹ 500', '₹ 500', '₹ 500', '₹ 500'],
      ],
    },
    sections: [
      {
        heading: 'Rules',
        fields: ['Due dates: 10 Apr / 10 Jul / 10 Oct / 10 Jan (quarterly)', 'Late fee: ₹20 per day after the due date', 'Sibling discount: 10% on tuition (younger ward)', 'Staff ward concession: as per policy'],
      },
    ],
    signatures: ['Accounts In-charge', 'Principal'],
    notes: 'The signed copy in the office prevails over this sheet.',
  },

  // ── Reports ─────────────────────────────────────────────────────────
  'doc-rpt-fee-monthly': {
    docTitle: 'MONTHLY FEE COLLECTION REPORT',
    subtitle: 'Accounts Office · Month of ________ 2026',
    table: {
      columns: ['Class', 'Students Billed', 'Collected (₹)', 'Pending (₹)', 'Collection %'],
      rows: [
        ['Pre-Primary', '24', '2,94,000', '3,30,000', '89.1%'],
        ['I–V', '96', '9,12,000', '10,20,000', '89.4%'],
        ['VI–VIII', '72', '6,84,000', '7,20,000', '95.0%'],
        ['IX–X', '48', '5,40,000', '5,40,000', '100.0%'],
        ['XI–XII', '36', '4,68,000', '5,04,000', '92.9%'],
        ['Total', '276', '28,98,000', '31,14,000', '93.1%'],
      ],
    },
    sections: [
      {
        heading: 'Mode-wise Collection',
        fields: ['Cash — ₹ 6,20,000', 'Online / UPI — ₹ 14,10,000', 'Cheque — ₹ 8,68,000', 'Cheques returned — 2 (₹ 40,000)'],
      },
    ],
    signatures: ['Accounts Officer', 'Principal'],
  },
  'doc-rpt-payroll-summary': {
    docTitle: 'PAYROLL DISBURSEMENT SUMMARY',
    subtitle: 'Month of ________ 2026',
    table: {
      columns: ['Category', 'Headcount', 'Gross (₹)', 'Deductions (₹)', 'Net Payout (₹)'],
      rows: [
        ['Teaching Staff', '58', '——', '——', '——'],
        ['Admin Staff', '12', '——', '——', '——'],
        ['Support Staff', '26', '——', '——', '——'],
        ['Contractual', '6', '——', '——', '——'],
        ['Total', '102', '——', '——', '——'],
      ],
    },
    sections: [
      {
        heading: 'Statutory Compliance',
        fields: ['PF deposited by 15th (Yes / No)', 'ESI challan (Yes / No)', 'TDS remitted (Yes / No)', 'Professional tax (Yes / No)'],
      },
    ],
    signatures: ['Payroll Officer', 'Principal'],
  },
  'doc-rpt-attendance': {
    docTitle: 'STUDENT ATTENDANCE SUMMARY',
    subtitle: 'Class-wise · Month of ________ 2026',
    table: {
      columns: ['Class', 'Working Days', 'Avg Attendance %', 'Below 75% Count', 'Chronic Absentees'],
      rows: [
        ['Pre-Primary', '24', '93.4%', '2', '—'],
        ['I–V', '24', '94.1%', '5', '—'],
        ['VI–VIII', '24', '92.8%', '6', '—'],
        ['IX–X', '24', '96.0%', '1', '—'],
        ['XI–XII', '24', '91.5%', '3', '—'],
      ],
    },
    sections: [
      {
        heading: 'Action Taken',
        fields: ['SMS reminders sent — 17', 'Counselling referrals — 3', 'Medical leave regularised — 4'],
      },
    ],
    signatures: ['Class Teachers', 'Coordinator', 'Principal'],
  },
  'doc-rpt-exam-result': {
    docTitle: 'EXAMINATION RESULT ANALYSIS',
    subtitle: 'Terminal Examination · Class-wise',
    table: {
      columns: ['Class', 'Appeared', 'Passed', 'Pass %', 'Avg %', 'Highest %'],
      rows: [
        ['VI', '72', '69', '95.8%', '76.2%', '97.4%'],
        ['VII', '72', '70', '97.2%', '77.8%', '98.1%'],
        ['VIII', '72', '68', '94.4%', '75.6%', '96.8%'],
        ['IX', '48', '43', '89.6%', '71.4%', '95.2%'],
        ['X', '48', '46', '95.8%', '78.9%', '98.6%'],
      ],
    },
    sections: [
      {
        heading: 'Subject Insight (Class X)',
        fields: ['Strongest subject — Mathematics (avg 82%)', 'Focus subject — Social Science (avg 69%)', 'Improvement plan shared with 3 subject teachers'],
      },
    ],
    signatures: ['Examination Cell', 'Principal'],
  },
}

/** Get the renderable content for a static document id (if any). */
export function getStaticDocContent(docId: string): StaticDocContent | undefined {
  return STATIC_DOC_CONTENT[docId]
}
