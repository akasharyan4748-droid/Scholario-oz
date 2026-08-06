'use client';

import React from 'react';

// -------------------------------------------------------------
// 8. LIBRARY
// -------------------------------------------------------------

export function LibraryView() {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Campus Library Catalog</h3>
      <div className="space-y-3">
        {[
          { title: 'Principles of Physics 11th Ed', isbn: 'ISBN 978-0128912', status: 'Available' },
          { title: 'Calculus and Analytic Geometry', isbn: 'ISBN 978-0442129', status: 'Checked Out (Arjun Sharma)' },
        ].map((book, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-display">{book.title}</h4>
              <span className="text-[10px] font-mono text-slate-400">{book.isbn}</span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${book.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
              {book.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
