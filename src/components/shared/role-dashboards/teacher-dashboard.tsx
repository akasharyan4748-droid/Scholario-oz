'use client';

import React, { useState } from 'react';
import {
  Clock,
  CalendarCheck,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

// ==========================================
// 3. TEACHER WORKSPACE COMPONENTS
// ==========================================

export function TeacherDashboard() {
  const [classes] = useState([
    { time: '08:30 AM', subject: 'Advanced Algebra', room: 'Room 304', grade: 'Grade X-B' },
    { time: '10:00 AM', subject: 'Physics Mechanics', room: 'Lab Delta', grade: 'Grade XII-A' },
    { time: '11:30 AM', subject: 'Discrete Mathematics', room: 'Room 102', grade: 'Grade XI-C' },
  ]);

  const [pupils, setPupils] = useState([
    { id: 1, name: 'Ananya Roy', present: true },
    { id: 2, name: 'Rohan Mehta', present: true },
    { id: 3, name: 'Suhail Khan', present: false },
    { id: 4, name: 'Sneha Patel', present: true },
  ]);

  const togglePupilAttendance = (id: number) => {
    setPupils(
      pupils.map((p) => (p.id === id ? { ...p, present: !p.present } : p))
    );
  };

  const presentCount = pupils.filter((p) => p.present).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lecture Timetable Calendar */}
      <div className="lg:col-span-2 backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
          <Clock className="w-5 h-5 text-brand-secondary" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Today’s Lecture Hours</h3>
        </div>

        <div className="space-y-3">
          {classes.map((cls, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-slate-200/30 dark:border-slate-800/30 gap-4 hover:border-brand-secondary/30 transition">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 text-xs font-bold font-mono bg-brand-primary/10 text-brand-primary rounded-md shrink-0">
                  {cls.time}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display">{cls.subject}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">{cls.grade} | {cls.room}</p>
                </div>
              </div>
              <button className="text-xs font-bold text-brand-secondary hover:underline cursor-pointer flex items-center gap-1">
                View Lesson Plan <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Classroom Quick Roll Call Attendance Sheet */}
      <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Active Roll Call</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/40 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
            {presentCount}/{pupils.length} PRESENT
          </span>
        </div>

        <div className="space-y-3">
          {pupils.map((pupil) => (
            <div
              key={pupil.id}
              onClick={() => togglePupilAttendance(pupil.id)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/20 dark:border-slate-800/20 cursor-pointer select-none hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-all"
            >
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{pupil.name}</span>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  pupil.present
                    ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                {pupil.present && <CheckCircle className="w-3.5 h-3.5" />}
              </div>
            </div>
          ))}
        </div>

        <button className="w-full py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition cursor-pointer shadow-sm">
          Submit Attendance Roll
        </button>
      </div>
    </div>
  );
}
