'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  FileUp,
  AlertCircle
} from 'lucide-react';

// ==========================================
// 4. STUDENT WORKSPACE COMPONENTS
// ==========================================

export function StudentDashboard() {
  const [homework, setHomework] = useState([
    { id: '1', task: 'Electromagnetism Lab Writeup', subject: 'Physics', due: 'Tomorrow, 5:00 PM', status: 'Pending' },
    { id: '2', task: 'Quadratic Equations Exercise Sheet', subject: 'Math', due: 'In 3 days', status: 'Pending' },
  ]);

  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // File drop mockup
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    triggerUploadSimulation();
  };

  const handleFileChange = () => {
    triggerUploadSimulation();
  };

  const triggerUploadSimulation = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          setHomework(
            homework.map((h) => (h.id === '1' ? { ...h, status: 'Submitted' } : h))
          );
          setTimeout(() => setUploadProgress(null), 1000);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Homework assignments panel */}
      <div className="lg:col-span-2 backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-secondary" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">My Pending Tasks</h3>
          </div>
          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-brand-primary/10 text-brand-primary rounded">
            {homework.filter((h) => h.status === 'Pending').length} ASSIGNMENTS
          </span>
        </div>

        <div className="space-y-3">
          {homework.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-slate-200/30 dark:border-slate-800/30 gap-4 hover:border-brand-secondary/20 transition">
              <div className="space-y-1">
                <span className="text-[10px] font-bold font-mono text-brand-secondary tracking-widest uppercase">{task.subject}</span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display">{task.task}</h4>
                <p className="text-[11px] text-slate-400 font-medium">Due: {task.due}</p>
              </div>

              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                task.status === 'Submitted'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
              }`}>
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Drag & Drop Assignment File Uploader (Usability Guidelines) */}
      <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
          <FileUp className="w-5 h-5 text-brand-secondary animate-pulse" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Upload Assignment</h3>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          className={`h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-4 transition ${
            dragOver
              ? 'border-brand-secondary bg-brand-secondary/5'
              : 'border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-black/20 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          {uploadProgress !== null ? (
            <div className="space-y-3 w-full max-w-[150px]">
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-secondary transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 block font-bold">UPLOADING... {uploadProgress}%</span>
            </div>
          ) : (
            <>
              <FileUp className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Drag and drop your lab file, or{' '}
                <label className="text-brand-secondary hover:underline cursor-pointer">
                  browse files
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              </p>
              <p className="text-[9px] text-slate-400 font-mono mt-1">PDF, DOCX, ZIP limits 20MB</p>
            </>
          )}
        </div>

        <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 flex gap-2.5 items-start">
          <AlertCircle className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Drop file directly above to auto-upload and mark <strong>Physics Writeup</strong> as Submitted.
          </p>
        </div>
      </div>
    </div>
  );
}
