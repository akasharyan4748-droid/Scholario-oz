'use client';

import React from 'react';
import { GraduationCap, Users, CalendarCheck, CreditCard, School } from 'lucide-react';
import type { WorkspaceStudent } from './shared';

// -------------------------------------------------------------
// 1. SCHOOL DASHBOARD (default case)
// -------------------------------------------------------------

export interface DashboardViewProps {
  students: WorkspaceStudent[];
}

export function DashboardView({ students }: DashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Institutional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Enrolled Pupils', val: '1,280', sub: 'Across 24 active cohorts', icon: GraduationCap, color: 'text-indigo-500' },
          { label: 'Active Faculty Heads', val: '74', sub: '100% screened faculty', icon: Users, color: 'text-brand-secondary' },
          { label: 'Daily Biometric Presence', val: '96.4%', sub: 'Real-time roll call sync', icon: CalendarCheck, color: 'text-emerald-500' },
          { label: 'Term Fee Collection', val: '92.1%', sub: '$8.4k pending balance', icon: CreditCard, color: 'text-amber-500' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-5 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-display">{stat.val}</div>
              <span className="text-[10px] text-slate-500 font-medium block">{stat.sub}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Enrolled Students */}
        <div className="lg:col-span-2 backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">Active Student Roster</h3>
            <span className="text-xs font-mono font-bold text-brand-secondary">{students.length} Pupils</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-2.5">UID</th>
                  <th className="pb-2.5">Student Name</th>
                  <th className="pb-2.5">Grade</th>
                  <th className="pb-2.5">Attendance</th>
                  <th className="pb-2.5 text-right">Fee Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition">
                    <td className="py-2.5 font-mono text-xs font-bold text-brand-secondary">{stu.id}</td>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200 font-display">{stu.name}</td>
                    <td className="py-2.5 text-xs text-slate-500">{stu.grade}</td>
                    <td className="py-2.5 font-mono text-xs">{stu.attendance}</td>
                    <td className="py-2.5 text-right">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${stu.fees === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800'}`}>
                        {stu.fees}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* School Circulars Board */}
        <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
            <School className="w-4 h-4 text-brand-secondary" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">Campus Bulletins</h3>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Term 1 Final Examination Timetable Published', date: 'Today, 08:30 AM' },
              { title: 'Parent-Teacher Meeting Scheduled for Friday', date: 'Yesterday' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/30 dark:bg-black/20 border border-slate-200/30 dark:border-slate-800/30 space-y-1">
                <span className="text-[9px] font-mono text-slate-400 block font-bold">{item.date}</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
