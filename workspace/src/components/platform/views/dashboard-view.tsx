'use client'

import React from 'react'
import { Building2, Users, DollarSign, Zap, Search, ArrowUpRight, ExternalLink } from 'lucide-react'
import type { ActiveSchool } from '../../shared/sidebar'
import type { SortingHatEntry, SortingHatFilter } from '../types'

interface DashboardViewProps {
  schools: ActiveSchool[]
  onOpenSchoolWorkspace: (school: ActiveSchool) => void
  sortingHatQuery: string
  setSortingHatQuery: (q: string) => void
  sortingHatFilter: SortingHatFilter
  setSortingHatFilter: (f: SortingHatFilter) => void
  filteredSortingHatResults: SortingHatEntry[]
}

export function DashboardView({
  schools,
  onOpenSchoolWorkspace,
  sortingHatQuery,
  setSortingHatQuery,
  sortingHatFilter,
  setSortingHatFilter,
  filteredSortingHatResults,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Platform Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Onboarded Academies', val: schools.length.toString(), sub: 'Active tenant gateways', icon: Building2, color: 'text-brand-secondary' },
          { label: 'Total Active Platform Users', val: '14,290', sub: 'Across all school tenants', icon: Users, color: 'text-indigo-500' },
          { label: 'Platform MRR Revenue', val: '$84,500', sub: '+12.4% MoM growth', icon: DollarSign, color: 'text-emerald-500' },
          { label: 'Global Edge Health SLA', val: '99.99%', sub: '0.08ms edge middleware', icon: Zap, color: 'text-amber-500' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-5 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-display">{stat.val}</div>
              <span className="text-[10px] text-slate-500 font-medium block">{stat.sub}</span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT UTILITY AREA: 🎩 SORTING HAT (Platform Search Only) */}
        <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl select-none">🎩</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">Sorting Hat</h3>
                <p className="text-[10px] text-slate-400 font-mono">Platform Intelligent Search</p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-brand-primary/10 text-brand-primary rounded">
              SEARCH UTILITY
            </span>
          </div>

          {/* Search Input Box */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search schools, users, invoices, audit logs..."
                value={sortingHatQuery}
                onChange={(e) => setSortingHatQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-secondary"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono font-bold scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'schools', label: 'Schools' },
                { id: 'users', label: 'Users' },
                { id: 'invoices', label: 'Invoices' },
                { id: 'logs', label: 'Audit Logs' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSortingHatFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                    sortingHatFilter === f.id
                      ? 'bg-brand-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Search Results */}
          <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar pt-1">
            {filteredSortingHatResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">
                No matching entities found for query.
              </div>
            ) : (
              filteredSortingHatResults.map((res, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (res.item) {
                      onOpenSchoolWorkspace(res.item)
                    }
                  }}
                  className={`p-2.5 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 flex items-center justify-between gap-3 ${
                    res.item ? 'hover:border-brand-secondary/40 cursor-pointer' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-brand-secondary/10 text-brand-secondary shrink-0">
                        {res.type}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-display">
                        {res.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {res.detail}
                    </p>
                  </div>
                  {res.item && (
                    <ArrowUpRight className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Platform Schools Quick Overview */}
        <div className="lg:col-span-2 backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-secondary" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Tenant Academies Overview</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-500">
              {schools.filter((s) => s.status === 'Active').length} / {schools.length} Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {schools.map((school) => (
              <div
                key={school.id}
                className="p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-white/40 dark:bg-slate-950/20 hover:border-brand-secondary/30 transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">{school.name}</h4>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                      school.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                    }`}>
                      {school.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-brand-secondary mt-1">{school.domain}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/30 dark:border-slate-800/30 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{school.code}</span>
                  <button
                    onClick={() => onOpenSchoolWorkspace(school)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    Open Workspace <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
