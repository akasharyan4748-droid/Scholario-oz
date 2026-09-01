'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  User
} from 'lucide-react';

// ==========================================
// 5. PARENT WORKSPACE COMPONENTS
// ==========================================

export function ParentDashboard() {
  const [ward] = useState({
    name: 'Ananya Roy',
    grade: 'Grade X-B',
    attendance: '98.2%',
    nextFeeAmount: '$450.00',
    feeDueDate: 'August 1st, 2026',
    status: 'Unpaid',
  });

  const [feeStatus, setFeeStatus] = useState('Unpaid');
  const [processingPayment, setProcessingPayment] = useState(false);

  const handlePayTuition = () => {
    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      setFeeStatus('Paid');
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Ward briefing metrics */}
      <div className="lg:col-span-2 backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
          <User className="w-5 h-5 text-brand-secondary" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Ward Progress Card</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-slate-200/30 dark:border-slate-800/30 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">Enrollment</span>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 font-display">{ward.name}</h4>
            <p className="text-xs text-slate-500">{ward.grade}</p>
          </div>

          <div className="p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-slate-200/30 dark:border-slate-800/30 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">Biometric Attendance Ratio</span>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 font-display">{ward.attendance}</h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Excellent attendance index</p>
          </div>
        </div>

        {/* Real-time gatepass log tracker */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Biometric Security Gate logs</span>
          <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-950/20 border border-slate-200/30 dark:border-slate-800/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Main Gate Exit</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">Today, 03:45 PM</span>
          </div>
        </div>
      </div>

      {/* Online tuition checkout bill card */}
      <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
          <CreditCard className="w-5 h-5 text-brand-secondary" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Tuition Invoices</h3>
        </div>

        <div className="p-4 rounded-xl bg-white/20 dark:bg-black/20 border border-slate-200/30 dark:border-slate-800/30 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Invoice Amount</span>
            <span className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">{ward.nextFeeAmount}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Payment Due Date</span>
            <span className="font-medium text-slate-600 dark:text-slate-400">{ward.feeDueDate}</span>
          </div>

          <div className="flex justify-between items-center text-xs border-t border-slate-200/30 dark:border-slate-700/30 pt-3">
            <span className="text-slate-500">Status</span>
            <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
              feeStatus === 'Paid'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
            }`}>
              {feeStatus}
            </span>
          </div>
        </div>

        {feeStatus === 'Unpaid' && (
          <button
            onClick={handlePayTuition}
            disabled={processingPayment}
            className="w-full py-2.5 text-xs font-bold text-white bg-brand-secondary hover:brightness-110 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 shadow"
          >
            {processingPayment ? 'SECURE ENCRYPTING...' : 'PAY TUITION FEE ONLINE'}
          </button>
        )}
      </div>
    </div>
  );
}
