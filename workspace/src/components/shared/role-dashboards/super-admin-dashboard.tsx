'use client';

import React, { useState } from 'react';
import { Building2, Plus } from 'lucide-react';

// ==========================================
// 1. SUPER ADMIN WORKSPACE COMPONENTS
// ==========================================

export function SuperAdminDashboard() {
  const [schools, setSchools] = useState([
    { id: '1', name: 'Emerald Heights Academy', domain: 'emerald.scholario.com', status: 'Active', plan: 'Enterprise' },
    { id: '2', name: 'Royal Oak Lyceum', domain: 'royaloak.org', status: 'Active', plan: 'Professional' },
    { id: '3', name: 'St. Xavier International', domain: 'stxaviers.edu', status: 'Pending Config', plan: 'Enterprise' },
  ]);

  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolDomain, setNewSchoolDomain] = useState('');

  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newSchoolDomain) return;
    setSchools([
      ...schools,
      {
        id: String(schools.length + 1),
        name: newSchoolName,
        domain: newSchoolDomain,
        status: 'Active',
        plan: 'Professional',
      },
    ]);
    setNewSchoolName('');
    setNewSchoolDomain('');
  };

  return (
    <div className="space-y-6">
      {/* Platform Status Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Edge Rewriter latency', val: '0.08ms', desc: 'Next.js Edge Middleware', status: 'Optimal', color: 'text-emerald-500' },
          { label: 'Active tenant isolated db pools', val: '124 / 150', desc: 'PostgreSQL Connection pooling', status: 'Optimal', color: 'text-brand-secondary' },
          { label: 'Capacitor Android compiling pipeline', val: 'Idle', desc: 'Codemagic CI/CD state', status: 'Ready', color: 'text-amber-500' },
        ].map((node, i) => (
          <div key={i} className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-2">
            <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">{node.label}</span>
            <div className="text-2xl font-black text-slate-950 dark:text-white font-display">{node.val}</div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">{node.desc}</span>
              <span className={`font-bold ${node.color}`}>{node.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Onboarded Institutions */}
      <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-secondary" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Active Tenant Registry</h3>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono font-bold bg-brand-primary/10 text-brand-primary rounded-md">
            {schools.length} ONBOARDED
          </span>
        </div>

        {/* Schools Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
                <th className="pb-3 pl-2">Institution Name</th>
                <th className="pb-3">Custom Subdomain</th>
                <th className="pb-3">Billing Tier</th>
                <th className="pb-3">Gateway isolation</th>
                <th className="pb-3 pr-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {schools.map((school) => (
                <tr key={school.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 pl-2 font-semibold text-slate-800 dark:text-slate-200">{school.name}</td>
                  <td className="py-3 font-mono text-xs text-brand-secondary">{school.domain}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {school.plan}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-[10px] text-slate-400">UUID-{school.id}1E5A</td>
                  <td className="py-3 pr-2 text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                      school.status.includes('Pending') ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${school.status.includes('Pending') ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {school.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Onboarding Institution (State Sync Interactive) */}
        <form onSubmit={handleAddSchool} className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Academy Name..."
            value={newSchoolName}
            onChange={(e) => setNewSchoolName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-secondary"
          />
          <input
            type="text"
            placeholder="Subdomain (e.g. oxford.edu)..."
            value={newSchoolDomain}
            onChange={(e) => setNewSchoolDomain(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-secondary"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-brand-secondary hover:brightness-110 rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Onboard Academy
          </button>
        </form>
      </div>
    </div>
  );
}
