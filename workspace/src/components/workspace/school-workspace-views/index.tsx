'use client';

import React, { useState } from 'react';
import { ActiveSchool } from '../../shared/sidebar';
import type {
  SchoolWorkspaceViewsProps,
  WorkspaceStudent,
  WorkspacePupil,
  WorkspaceFee,
  WorkspaceAiLog,
} from './shared';

// View components
import { DashboardView } from './dashboard-view';
import { StudentsView } from './students-view';
import { TeachersView } from './teachers-view';
import { ParentsView } from './parents-view';
import { AttendanceView } from './attendance-view';
import { ClassesView } from './classes-view';
import { FeesView } from './fees-view';
import { LibraryView } from './library-view';
import { ReportsView } from './reports-view';
import { WebsiteBuilderView } from './website-builder-view';
import { AppBuilderView } from './app-builder-view';
import { BrandingView } from './branding-view';
import { DomainsView } from './domains-view';
import { AdmissionsView } from './admissions-view';
import { SettingsView } from './settings-view';
import { AiAssistantView } from './ai-assistant-view';

export function SchoolWorkspaceViews({
  activeItem,
  activeSchool,
}: SchoolWorkspaceViewsProps) {
  // Shared state for interactive school sub-modules

  // Students state
  const [students, setStudents] = useState<WorkspaceStudent[]>([
    { id: 'STU-101', name: 'Ananya Roy', grade: 'Grade X-B', parent: 'Dr. S. Roy', attendance: '98.2%', fees: 'Paid' },
    { id: 'STU-102', name: 'Arjun Sharma', grade: 'Grade X-B', parent: 'Rakesh Sharma', attendance: '96.4%', fees: 'Paid' },
    { id: 'STU-103', name: 'Priya Patel', grade: 'Grade XII-A', parent: 'Dilip Patel', attendance: '92.1%', fees: 'Pending' },
    { id: 'STU-104', name: 'Karan Malhotra', grade: 'Grade IX-C', parent: 'Sanjay Malhotra', attendance: '88.7%', fees: 'Paid' },
  ]);
  const [studentSearch, setStudentSearch] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('Grade X-B');

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName) return;
    setStudents([
      ...students,
      {
        id: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: newStudentName,
        grade: newStudentGrade,
        parent: 'Guardian Contact',
        attendance: '100%',
        fees: 'Paid',
      },
    ]);
    setNewStudentName('');
  };

  // Attendance state
  const [pupilsAttendance, setPupilsAttendance] = useState<WorkspacePupil[]>([
    { id: 1, name: 'Ananya Roy', present: true },
    { id: 2, name: 'Arjun Sharma', present: true },
    { id: 3, name: 'Priya Patel', present: false },
    { id: 4, name: 'Karan Malhotra', present: true },
  ]);

  const toggleAttendance = (id: number) => {
    setPupilsAttendance(
      pupilsAttendance.map((p) => (p.id === id ? { ...p, present: !p.present } : p))
    );
  };

  // Fees Desk State
  const [fees, setFees] = useState<WorkspaceFee[]>([
    { id: 'INV-001', student: 'Priya Patel', amount: '$450.00', due: 'Aug 1, 2026', status: 'Pending' },
    { id: 'INV-002', student: 'Ananya Roy', amount: '$450.00', due: 'July 15, 2026', status: 'Paid' },
  ]);

  // Branding Customizer State
  const [schoolPrimaryColor, setSchoolPrimaryColor] = useState('#064e3b');
  const [schoolSecondaryColor, setSchoolSecondaryColor] = useState('#059669');

  // AI Assistant Query State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLogs, setAiLogs] = useState<WorkspaceAiLog[]>([
    { prompt: 'Generate Physics Grade X Quiz questions on Electromagnetism', response: '1. What is Lenz’s Law?\n2. Calculate magnetic flux density for a coil of 50 turns...' },
  ]);

  const handleRunAiAssistant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setAiLogs([
      ...aiLogs,
      {
        prompt: aiPrompt,
        response: `Scholario AI Assistant Generated Output for "${aiPrompt}":\n- Structured circular ready for distribution to ${activeSchool.name} parents and staff.`,
      },
    ]);
    setAiPrompt('');
  };

  // Switch based on activeItem inside School Workspace
  switch (activeItem) {
    // -------------------------------------------------------------
    // 1. SCHOOL DASHBOARD
    // -------------------------------------------------------------
    case 'school-dashboard':
    default:
      return <DashboardView students={students} />;

    // -------------------------------------------------------------
    // 2. STUDENTS
    // -------------------------------------------------------------
    case 'school-students':
      return (
        <StudentsView
          students={students}
          studentSearch={studentSearch}
          setStudentSearch={setStudentSearch}
          newStudentName={newStudentName}
          setNewStudentName={setNewStudentName}
          handleAddStudent={handleAddStudent}
        />
      );

    // -------------------------------------------------------------
    // 3. TEACHERS
    // -------------------------------------------------------------
    case 'school-teachers':
      return <TeachersView />;

    // -------------------------------------------------------------
    // 4. PARENTS
    // -------------------------------------------------------------
    case 'school-parents':
      return <ParentsView />;

    // -------------------------------------------------------------
    // 5. ATTENDANCE
    // -------------------------------------------------------------
    case 'school-attendance':
      return (
        <AttendanceView
          pupilsAttendance={pupilsAttendance}
          toggleAttendance={toggleAttendance}
        />
      );

    // -------------------------------------------------------------
    // 6. CLASSES
    // -------------------------------------------------------------
    case 'school-classes':
      return <ClassesView />;

    // -------------------------------------------------------------
    // 7. FEES
    // -------------------------------------------------------------
    case 'school-fees':
      return <FeesView fees={fees} />;

    // -------------------------------------------------------------
    // 8. LIBRARY
    // -------------------------------------------------------------
    case 'school-library':
      return <LibraryView />;

    // -------------------------------------------------------------
    // 9. REPORTS
    // -------------------------------------------------------------
    case 'school-reports':
      return <ReportsView activeSchool={activeSchool} />;

    // -------------------------------------------------------------
    // 10. WEBSITE BUILDER
    // -------------------------------------------------------------
    case 'school-website-builder':
      return <WebsiteBuilderView activeSchool={activeSchool} />;

    // -------------------------------------------------------------
    // 11. APP BUILDER
    // -------------------------------------------------------------
    case 'school-app-builder':
      return <AppBuilderView activeSchool={activeSchool} />;

    // -------------------------------------------------------------
    // 12. BRANDING
    // -------------------------------------------------------------
    case 'school-branding':
      return (
        <BrandingView
          schoolPrimaryColor={schoolPrimaryColor}
          setSchoolPrimaryColor={setSchoolPrimaryColor}
          schoolSecondaryColor={schoolSecondaryColor}
          setSchoolSecondaryColor={setSchoolSecondaryColor}
        />
      );

    // -------------------------------------------------------------
    // 13. DOMAINS
    // -------------------------------------------------------------
    case 'school-domains':
      return <DomainsView activeSchool={activeSchool} />;

    // -------------------------------------------------------------
    // 14. ADMISSIONS
    // -------------------------------------------------------------
    case 'school-admissions':
      return <AdmissionsView />;

    // -------------------------------------------------------------
    // 15. SETTINGS
    // -------------------------------------------------------------
    case 'school-settings':
      return <SettingsView activeSchool={activeSchool} />;

    // -------------------------------------------------------------
    // 16. AI ASSISTANT
    // -------------------------------------------------------------
    case 'school-ai-assistant':
      return (
        <AiAssistantView
          aiLogs={aiLogs}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          handleRunAiAssistant={handleRunAiAssistant}
        />
      );
  }
}

export type { SchoolWorkspaceViewsProps };
export type { ActiveSchool };
