'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';
import type { WorkspaceStudent } from './shared';

// -------------------------------------------------------------
// 2. STUDENTS
// -------------------------------------------------------------

export interface StudentsViewProps {
  students: WorkspaceStudent[];
  studentSearch: string;
  setStudentSearch: (value: string) => void;
  newStudentName: string;
  setNewStudentName: (value: string) => void;
  handleAddStudent: (e: React.FormEvent) => void;
}

export function StudentsView({
  students,
  studentSearch,
  setStudentSearch,
  newStudentName,
  setNewStudentName,
  handleAddStudent,
}: StudentsViewProps) {
  return (
    <div className="space-y-6">
      <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <form onSubmit={handleAddStudent} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="New student name..."
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold text-white bg-brand-primary rounded-xl hover:bg-brand-primary/90 cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Enroll
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                <th className="pb-3 pl-2">UID</th>
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Grade Cohort</th>
                <th className="pb-3">Parent Link</th>
                <th className="pb-3">Attendance</th>
                <th className="pb-3 pr-2 text-right">Fee Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {students
                .filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                .map((s) => (
                  <tr key={s.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition">
                    <td className="py-3 pl-2 font-mono text-xs font-bold text-brand-secondary">{s.id}</td>
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200 font-display">{s.name}</td>
                    <td className="py-3 text-xs text-slate-500">{s.grade}</td>
                    <td className="py-3 text-xs font-semibold text-slate-600 dark:text-slate-400">{s.parent}</td>
                    <td className="py-3 font-mono text-xs">{s.attendance}</td>
                    <td className="py-3 pr-2 text-right">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${s.fees === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800'}`}>
                        {s.fees}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
