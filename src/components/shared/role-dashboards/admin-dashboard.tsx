'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  CreditCard,
  CalendarCheck,
  Mail,
  Plus,
  Send
} from 'lucide-react';

// ==========================================
// 2. ADMIN WORKSPACE COMPONENTS
// ==========================================

export function AdminDashboard() {
  const [students, setStudents] = useState([
    { uid: 'STU-0842', name: 'Arjun Sharma', class: 'Grade X-B', parent: 'Rakesh Sharma', attendance: '96.4%', fees: 'Paid' },
    { uid: 'STU-1294', name: 'Priya Patel', class: 'Grade XII-A', parent: 'Dilip Patel', attendance: '92.1%', fees: 'Pending' },
    { uid: 'STU-2051', name: 'Karan Malhotra', class: 'Grade IX-C', parent: 'Sanjay Malhotra', attendance: '88.7%', fees: 'Paid' },
  ]);

  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('Grade X-B');

  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName) return;
    setStudents([
      ...students,
      {
        uid: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: studentName,
        class: studentClass,
        parent: 'Guardian Mock',
        attendance: '100%',
        fees: 'Paid',
      },
    ]);
    setStudentName('');
  };

  const [announcements, setAnnouncements] = useState([
    { id: 1, title: 'Term 1 Final Examination Rosters Published', date: 'Today' },
    { id: 2, title: 'Global Science Fair registration limits extended', date: 'Yesterday' }
  ]);
  const [announcementInput, setAnnouncementInput] = useState('');

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementInput) return;
    setAnnouncements([
      { id: announcements.length + 1, title: announcementInput, date: 'Just now' },
      ...announcements
    ]);
    setAnnouncementInput('');
  };

  return (
    <div className="space-y-6">
      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Enrolled Pupils', val: '1,482', change: '+4.2% semester delta', icon: GraduationCap, color: 'text-indigo-500' },
          { label: 'Active Faculty Heads', val: '86', change: '100% background screened', icon: Users, color: 'text-brand-secondary' },
          { label: 'Term Fees Collection Rate', val: '91.8%', change: '$12.4k pending collection', icon: CreditCard, color: 'text-emerald-500' },
          { label: 'Average Daily Attendance', val: '94.6%', change: 'Real-time biometric sync', icon: CalendarCheck, color: 'text-amber-500' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1.5 min-w-0">
                <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{stat.label}</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display leading-none">{stat.val}</span>
                <span className="text-[10px] text-slate-500 block truncate">{stat.change}</span>
              </div>
              <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Directory Panel (Col Span 2) */}
        <div className="lg:col-span-2 backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Recent Registrations</h3>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              {students.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
                  <th className="pb-2.5">Student UID</th>
                  <th className="pb-2.5">Full Name</th>
                  <th className="pb-2.5">Class Cohort</th>
                  <th className="pb-2.5">Cumulative Attendance</th>
                  <th className="pb-2.5 text-right">Fee Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {students.map((student) => (
                  <tr key={student.uid} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-2.5 font-mono text-xs font-bold text-brand-secondary">{student.uid}</td>
                    <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{student.name}</td>
                    <td className="py-2.5 text-slate-500 text-xs">{student.class}</td>
                    <td className="py-2.5 font-mono text-xs">{student.attendance}</td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        student.fees === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400'
                      }`}>
                        {student.fees}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Form to register mock student */}
          <form onSubmit={handleRegisterStudent} className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Pupil Full Name..."
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <select
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Grade IX-C">Grade IX-C</option>
              <option value="Grade X-B">Grade X-B</option>
              <option value="Grade XII-A">Grade XII-A</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Enroll Student
            </button>
          </form>
        </div>

        {/* School Announcements Broadcast Board */}
        <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
            <Mail className="w-5 h-5 text-brand-secondary" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Campus Announcements</h3>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-3 rounded-xl bg-white/30 dark:bg-black/35 border border-slate-200/30 dark:border-slate-800/30 space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                  <span>CIRCULAR #{ann.id}</span>
                  <span>{ann.date}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">{ann.title}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddAnnouncement} className="space-y-2 pt-2">
            <textarea
              placeholder="Compose broadcast message..."
              value={announcementInput}
              onChange={(e) => setAnnouncementInput(e.target.value)}
              className="w-full h-16 p-2.5 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none resize-none font-sans"
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-brand-secondary hover:brightness-110 rounded-xl transition cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Broadcast to Portals
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
