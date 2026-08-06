import type { SchoolSettingsState } from './types'

type StateShape = Omit<SchoolSettingsState, keyof SchoolSettingsActions>

// Pull just the action keys out of SchoolSettingsState so the initial-state
// object below can be typed as "everything except the actions".
interface SchoolSettingsActions {
  updateGeneral: SchoolSettingsState['updateGeneral']
  updateAcademics: SchoolSettingsState['updateAcademics']
  updateTimetable: SchoolSettingsState['updateTimetable']
  updateFees: SchoolSettingsState['updateFees']
  updatePayroll: SchoolSettingsState['updatePayroll']
  addBook: SchoolSettingsState['addBook']
  removeBook: SchoolSettingsState['removeBook']
  addUniformItem: SchoolSettingsState['addUniformItem']
  removeUniformItem: SchoolSettingsState['removeUniformItem']
  addHouse: SchoolSettingsState['addHouse']
  updateHouse: SchoolSettingsState['updateHouse']
  addFeeHead: SchoolSettingsState['addFeeHead']
  removeFeeHead: SchoolSettingsState['removeFeeHead']
  addSubject: SchoolSettingsState['addSubject']
  removeSubject: SchoolSettingsState['removeSubject']
  addClass: SchoolSettingsState['addClass']
  removeClass: SchoolSettingsState['removeClass']
  updateAdmissionSettings: SchoolSettingsState['updateAdmissionSettings']
  updateAdmissionFeatureFlags: SchoolSettingsState['updateAdmissionFeatureFlags']
  updateSeatCapacity: SchoolSettingsState['updateSeatCapacity']
  updateDuplicateDetection: SchoolSettingsState['updateDuplicateDetection']
  addWaiverAudit: SchoolSettingsState['addWaiverAudit']
  updateFacilities: SchoolSettingsState['updateFacilities']
}

// Initial non-action state for the School Settings store. Splitting this out
// keeps the store creation file small while preserving every seeded value.
export const initialState: StateShape = {
  general: {
    schoolName: 'Demo School of Scholario',
    shortName: 'Demo School',
    tagline: 'Excellence in Education & Innovation',
    affiliation: 'CBSE — Affiliation No. 1730456',
    address: '100 Knowledge Parkway, Sector 47, Gurugram, Haryana 122003',
    phone: '9876543210',
    email: 'info@demoschool.edu',
    website: 'www.demoschool.edu',
    principalName: 'Dr. Ananya Iyer',
    vicePrincipalName: 'Mr. Suresh Nair',
    established: 2020,
    logoText: 'D',
    brandColor: 'oklch(0.55 0.14 162)',
  },

  academics: {
    currentSession: '2025–2026',
    academicSessions: ['2023–2024', '2024–2025', '2025–2026', '2026–2027'],
    board: 'CBSE Central Board of Secondary Education',
    curriculum: 'NCERT & Experiential Learning Framework',
    streams: [
      'PCM (Physics, Chemistry, Mathematics)',
      'PCB (Physics, Chemistry, Biology)',
      'PCMB (Physics, Chem, Math, Bio)',
      'Commerce with Applied Math',
      'Commerce with Computer Science',
      'Humanities & Social Sciences',
      'Arts & Fine Arts',
    ],
    categories: ['General', 'OBC', 'SC', 'ST', 'EWS'],
    classes: [
      { id: 'C01', name: 'Nursery', sections: ['A', 'B'] },
      { id: 'C02', name: 'LKG', sections: ['A', 'B'] },
      { id: 'C03', name: 'UKG', sections: ['A', 'B'] },
      { id: 'C04', name: 'Class 1', sections: ['A', 'B'] },
      { id: 'C05', name: 'Class 2', sections: ['A', 'B'] },
      { id: 'C06', name: 'Class 3', sections: ['A', 'B'] },
      { id: 'C07', name: 'Class 4', sections: ['A', 'B'] },
      { id: 'C08', name: 'Class 5', sections: ['A', 'B'] },
      { id: 'C09', name: 'Class 6', sections: ['A', 'B'] },
      { id: 'C10', name: 'Class 7', sections: ['A', 'B'] },
      { id: 'C11', name: 'Class 8', sections: ['A', 'B'] },
      { id: 'C12', name: 'Class 9', sections: ['A', 'B'] },
      { id: 'C13', name: 'Class 10', sections: ['A', 'B'] },
      { id: 'C14', name: 'Class 11', sections: ['A', 'B'], stream: 'PCM' },
      { id: 'C15', name: 'Class 12', sections: ['A', 'B'], stream: 'PCM' },
    ],
    subjects: [
      { id: 'S01', name: 'English Core', code: 'ENG-301', category: 'Core', color: 'oklch(0.55 0.14 162)' },
      { id: 'S02', name: 'Mathematics', code: 'MTH-041', category: 'Core', color: 'oklch(0.6 0.18 300)' },
      { id: 'S03', name: 'Physics', code: 'PHY-042', category: 'Core', color: 'oklch(0.6 0.18 280)' },
      { id: 'S04', name: 'Chemistry', code: 'CHM-043', category: 'Core', color: 'oklch(0.65 0.16 150)' },
      { id: 'S05', name: 'Biology', code: 'BIO-044', category: 'Core', color: 'oklch(0.6 0.18 140)' },
      { id: 'S06', name: 'Computer Science', code: 'CS-083', category: 'Elective', color: 'oklch(0.5 0.2 250)' },
      { id: 'S07', name: 'Accountancy', code: 'ACC-055', category: 'Core', color: 'oklch(0.7 0.16 75)' },
      { id: 'S08', name: 'Physical Education', code: 'PED-048', category: 'Activity', color: 'oklch(0.65 0.2 25)' },
    ],
    examStructures: [
      { id: 'ex-u1', name: 'Unit Test I', weightage: 10 },
      { id: 'ex-t1', name: 'Mid Term / Term 1', weightage: 40 },
      { id: 'ex-u2', name: 'Unit Test II', weightage: 10 },
      { id: 'ex-fn', name: 'Annual / Final Term', weightage: 40 },
    ],
  },

  timetable: {
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    startTime: '08:00 AM',
    endTime: '02:15 PM',
    periodDurationMinutes: 40,
    lunchBreakStart: '12:00 PM',
    lunchBreakDurationMinutes: 40,
    assemblyDurationMinutes: 20,
    holidayRules: 'Second Saturday of every month is a gazetted holiday.',
  },

  fees: {
    feeHeads: [
      { id: 'fh-1', name: 'Tuition Fee', type: 'Tuition', defaultAmount: 4500, frequency: 'Monthly' },
      { id: 'fh-2', name: 'Admission Fee', type: 'Admission', defaultAmount: 15000, frequency: 'One-Time' },
      { id: 'fh-3', name: 'Annual Activity Fee', type: 'Annual', defaultAmount: 8000, frequency: 'Annual' },
      { id: 'fh-4', name: 'Computer & Science Lab Fee', type: 'Lab', defaultAmount: 1200, frequency: 'Quarterly' },
      { id: 'fh-5', name: 'Library Deposit', type: 'Library', defaultAmount: 1000, frequency: 'One-Time' },
      { id: 'fh-6', name: 'Examination Fee', type: 'Exam', defaultAmount: 850, frequency: 'Term' },
    ],
    discounts: [
      { id: 'dc-1', name: 'Sibling Concession', type: 'Percentage', value: 15, code: 'SIBLING15' },
      { id: 'dc-2', name: 'Merit Scholarship', type: 'Percentage', value: 25, code: 'MERIT25' },
      { id: 'dc-3', name: 'Staff Ward Discount', type: 'Percentage', value: 50, code: 'STAFF50' },
      { id: 'dc-4', name: 'EWS Full Scholarship', type: 'Percentage', value: 100, code: 'EWS100' },
    ],
    installmentsCount: 4,
    lateFeePerDay: 50,
    paymentRules: 'Fees due by 10th of every quarter. Late fee applicable post due date.',
  },

  payroll: {
    payGrades: [
      { id: 'pg-1', grade: 'Grade A', title: 'Senior PGT / Dept Head', basePay: 75000, hra: 15000, da: 9000, pfDeduction: 1800 },
      { id: 'pg-2', grade: 'Grade B', title: 'TGT Subject Teacher', basePay: 55000, hra: 11000, da: 6600, pfDeduction: 1800 },
      { id: 'pg-3', grade: 'Grade C', title: 'PRT Primary Educator', basePay: 42000, hra: 8400, da: 5040, pfDeduction: 1800 },
      { id: 'pg-4', grade: 'Grade D', title: 'Administrative & Support Staff', basePay: 28000, hra: 5600, da: 3360, pfDeduction: 1800 },
    ],
    pfRate: 12,
    esiRate: 0.75,
    tdsApplicable: true,
  },

  bookStore: [
    { id: 'bk-1', classId: 'C05', className: 'Class 2', bookName: 'NCERT Marigold English Book 2', publisher: 'NCERT', category: 'Textbook', price: 120, stock: 85, isMandatory: true },
    { id: 'bk-2', classId: 'C05', className: 'Class 2', bookName: 'Joyful Mathematics Class 2', publisher: 'NCERT', category: 'Textbook', price: 140, stock: 90, isMandatory: true },
    { id: 'bk-3', classId: 'C05', className: 'Class 2', bookName: 'Rimjhim Hindi Book 2', publisher: 'NCERT', category: 'Textbook', price: 110, stock: 78, isMandatory: true },
    { id: 'bk-4', classId: 'C05', className: 'Class 2', bookName: 'EVS Our Earth & Surroundings', publisher: 'Orient Blackswan', category: 'Workbook', price: 210, stock: 65, isMandatory: false },
    { id: 'bk-5', classId: 'C12', className: 'Class 9', bookName: 'NCERT Science Class 9', publisher: 'NCERT', category: 'Textbook', price: 180, stock: 120, isMandatory: true },
    { id: 'bk-6', classId: 'C12', className: 'Class 9', bookName: 'NCERT Mathematics Class 9', publisher: 'NCERT', category: 'Textbook', price: 195, stock: 115, isMandatory: true },
  ],

  uniforms: [
    { id: 'un-1', name: 'Polo Shirt (White & Emerald)', category: 'Summer', price: 450, sizes: ['S', 'M', 'L', 'XL'], stock: 150 },
    { id: 'un-2', name: 'Formal Trousers / Skirt', category: 'Formal', price: 650, sizes: ['28', '30', '32', '34'], stock: 120 },
    { id: 'un-3', name: 'Winter Woolen Blazer', category: 'Winter', price: 1800, sizes: ['32', '34', '36', '38'], stock: 80 },
    { id: 'un-4', name: 'House Sports Tracksuit', category: 'Sports', price: 950, sizes: ['S', 'M', 'L'], stock: 95 },
  ],

  transport: {
    routes: [
      { id: 'rt-1', name: 'Route 1 · Cyber City – Sector 56', fare: 2500, vehicleNo: 'HR-26-PA-8812', driverName: 'Ramesh Singh', driverPhone: '9812345678', stopsCount: 8 },
      { id: 'rt-2', name: 'Route 2 · Golf Course Road – DLF Ph 5', fare: 2800, vehicleNo: 'HR-26-PB-9901', driverName: 'Sohan Lal', driverPhone: '9823456789', stopsCount: 10 },
      { id: 'rt-3', name: 'Route 3 · Sohna Road – Subhash Chowk', fare: 2200, vehicleNo: 'HR-26-PC-4432', driverName: 'Vikram Yadav', driverPhone: '9834567890', stopsCount: 6 },
    ],
  },

  library: {
    categories: ['Fiction', 'Science & Technology', 'History & Social Studies', 'Biographies', 'Reference & Encyclopedias', 'Periodicals & Journals'],
    maxBooksPerStudent: 3,
    issueDays: 14,
    lateFinePerDay: 5,
  },

  houses: [
    { id: 'hs-1', name: 'Aryabhata', color: '#ef4444', captain: 'Aarav Sharma (12-A)', viceCaptain: 'Ananya Gupta (11-B)' },
    { id: 'hs-2', name: 'Bhaskara', color: '#3b82f6', captain: 'Vihaan Verma (12-B)', viceCaptain: 'Diya Patel (11-A)' },
    { id: 'hs-3', name: 'Ramanujan', color: '#10b981', captain: 'Aditya Rao (12-A)', viceCaptain: 'Meera Nair (11-A)' },
    { id: 'hs-4', name: 'Tagore', color: '#f59e0b', captain: 'Kavya Singh (12-B)', viceCaptain: 'Rohan Mehta (11-B)' },
  ],

  facilities: {
    hasHostelFacility: true,
    hasTransportFacility: true,
  },

  admissionSettings: {
    requiredDocs: [
      'Birth Certificate',
      'Transfer Certificate (TC)',
      'Previous Class Marksheet',
      'Aadhaar Card (Student & Parent)',
      'Passport Size Photographs (4)',
      'Category Certificate (if applicable)',
    ],
    studentIdFormat: 'ADM-2026-XXXX',
    rollNumberFormat: 'CLASS-SEC-ROLL',
    autoEnrollBooks: true,
    workflowSteps: ['Application Submission', 'Document Verification', 'Principal Interview', 'Fee Payment & Enrollment'],
    showPersonalDataOnLetter: false,
    rejectionRetentionDays: 60,
    fieldRules: [
      { fieldKey: 'aadhaarNo', label: 'Student Aadhaar Number', section: 'Personal', visible: true, required: false },
      { fieldKey: 'bloodGroup', label: 'Blood Group', section: 'Personal', visible: true, required: false },
      { fieldKey: 'religion', label: 'Religion', section: 'Personal', visible: true, required: false },
      { fieldKey: 'category', label: 'Social Category', section: 'Personal', visible: true, required: true },
      { fieldKey: 'fatherAadhaar', label: 'Father Aadhaar Number', section: 'Parents', visible: true, required: false },
      { fieldKey: 'motherAadhaar', label: 'Mother Aadhaar Number', section: 'Parents', visible: true, required: false },
      { fieldKey: 'previousBoard', label: 'Previous School Board', section: 'Previous School', visible: true, required: false },
      { fieldKey: 'tcNumber', label: 'Transfer Certificate Number', section: 'Previous School', visible: true, required: false },
      { fieldKey: 'allergies', label: 'Known Allergies', section: 'Medical', visible: true, required: false },
      { fieldKey: 'doctorName', label: 'Family Doctor Name', section: 'Medical', visible: true, required: false },
      { fieldKey: 'hostelRoomType', label: 'Hostel Room Preference', section: 'Transport & Hostel', visible: true, required: false },
      { fieldKey: 'transportRoute', label: 'Transport Bus Route', section: 'Transport & Hostel', visible: true, required: false },
    ],
    featureFlags: {
      enableMedical: true,
      enableHostel: false,
      enableTransport: true,
      enableEntranceExam: false,
      enableInterview: true,
      enablePreviousSchool: true,
      enableScholarship: true,
      enableFeeWaiver: true,
      enableDocumentVerification: true,
      enableAadhaar: true,
      enableBloodGroup: true,
      enableReligion: true,
      enableCategory: true,
      enableStudentPhoto: true,
      enableParentPhoto: false,
      enableSignature: false,
      enableCustomFields: false,
      previousSchoolSkipClasses: ['Nursery', 'LKG', 'UKG', 'Class 1'],
      boards: ['CBSE'],
    },
    seatCapacity: [
      { className: 'Nursery', capacity: 30, enrolled: 24, waitlistThreshold: 0.9 },
      { className: 'LKG', capacity: 30, enrolled: 27, waitlistThreshold: 0.9 },
      { className: 'UKG', capacity: 30, enrolled: 28, waitlistThreshold: 0.9 },
      { className: 'Class 1', capacity: 35, enrolled: 32, waitlistThreshold: 0.9 },
      { className: 'Class 2', capacity: 35, enrolled: 30, waitlistThreshold: 0.9 },
      { className: 'Class 3', capacity: 35, enrolled: 28, waitlistThreshold: 0.9 },
      { className: 'Class 4', capacity: 35, enrolled: 26, waitlistThreshold: 0.9 },
      { className: 'Class 5', capacity: 35, enrolled: 31, waitlistThreshold: 0.9 },
      { className: 'Class 6', capacity: 40, enrolled: 34, waitlistThreshold: 0.9 },
      { className: 'Class 7', capacity: 40, enrolled: 33, waitlistThreshold: 0.9 },
      { className: 'Class 8', capacity: 40, enrolled: 29, waitlistThreshold: 0.9 },
      { className: 'Class 9', capacity: 40, enrolled: 36, waitlistThreshold: 0.9 },
      { className: 'Class 10', capacity: 40, enrolled: 38, waitlistThreshold: 0.9 },
      { className: 'Class 11', capacity: 45, enrolled: 22, waitlistThreshold: 0.9 },
      { className: 'Class 12', capacity: 45, enrolled: 25, waitlistThreshold: 0.9 },
    ],
    duplicateDetection: {
      enabled: true,
      blockThreshold: 99,
      warnThreshold: 70,
      checkKeys: {
        aadhaar: true,
        nameDob: true,
        parentPhone: true,
        parents: true,
        previousSchool: true,
        address: true,
      },
    },
    waiverAudit: [],
    // Admission defaults — inherited by new applications automatically
    defaultNationality: 'Indian',
    defaultReligion: 'Hindu',
    schoolState: 'Uttar Pradesh',
    schoolDistrict: 'Ghazipur',
    previousBoards: ['CBSE', 'ICSE', 'IB', 'State Board', 'IGCSE', 'Other'],
  },
}
