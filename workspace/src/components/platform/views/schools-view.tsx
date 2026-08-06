'use client'

import React from 'react'
import {
  Search, Filter, Grid, List, Plus, Ban, Archive, Trash2, ExternalLink,
} from 'lucide-react'
import type { ActiveSchool } from '../../shared/sidebar'
import type {
  SchoolStatusFilter,
  ViewMode,
} from '../types'
import { CreateSchoolModal } from './create-school-modal'

interface SchoolsViewProps {
  schools: ActiveSchool[]
  onOpenSchoolWorkspace: (school: ActiveSchool) => void
  schoolSearch: string
  setSchoolSearch: (q: string) => void
  statusFilter: SchoolStatusFilter
  setStatusFilter: (s: SchoolStatusFilter) => void
  viewMode: ViewMode
  setViewMode: (v: ViewMode) => void
  showCreateModal: boolean
  setShowCreateModal: (s: boolean) => void
  newSchoolName: string
  setNewSchoolName: (s: string) => void
  newSchoolDomain: string
  setNewSchoolDomain: (s: string) => void
  newSchoolCode: string
  setNewSchoolCode: (s: string) => void
  handleCreateSchool: (e: React.FormEvent) => void
  handleToggleStatus: (id: string, targetStatus: 'Active' | 'Suspended' | 'Archived') => void
  handleDeleteSchool: (id: string) => void
  filteredSchools: ActiveSchool[]
}

export function SchoolsView(props: SchoolsViewProps) {
  const {
    schools,
    onOpenSchoolWorkspace,
    schoolSearch,
    setSchoolSearch,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    showCreateModal,
    setShowCreateModal,
    newSchoolName,
    setNewSchoolName,
    newSchoolDomain,
    setNewSchoolDomain,
    newSchoolCode,
    setNewSchoolCode,
    handleCreateSchool,
    handleToggleStatus,
    handleDeleteSchool,
    filteredSchools,
  } = props
  void schools

  return (
    <div className="space-y-6">
      {/* Action Bar: Search, Filters, View Mode, Create School */}
      <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Search + Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by school name, domain or code..."
              value={schoolSearch}
              onChange={(e) => setSchoolSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-secondary"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Suspended">Suspended</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        {/* View Mode & Create School Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 border border-slate-200/50 dark:border-slate-800/50 p-1 rounded-xl bg-white/40 dark:bg-slate-950/20">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-slate-600'}`}
              aria-label="Grid view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'table' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-slate-600'}`}
              aria-label="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-secondary hover:brightness-110 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create School</span>
          </button>
        </div>
      </div>

      {/* Grid or List Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.map((school) => (
            <div
              key={school.id}
              className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between hover:border-brand-secondary/40 transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold font-display text-sm">
                      {school.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display leading-snug">
                        {school.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">{school.code}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                    school.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : school.status === 'Suspended'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {school.status}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/30 dark:bg-black/20 border border-slate-200/30 dark:border-slate-800/30">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 font-mono block">Subdomain Gateway</span>
                  <span className="text-xs font-bold font-mono text-brand-secondary">{school.domain}</span>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(school.id, school.status === 'Suspended' ? 'Active' : 'Suspended')}
                    title={school.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                    className="p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 text-slate-500 hover:text-amber-600 transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(school.id, school.status === 'Archived' ? 'Active' : 'Archived')}
                    title={school.status === 'Archived' ? 'Unarchive' : 'Archive'}
                    className="p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSchool(school.id)}
                    title="Delete School"
                    className="p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 text-slate-500 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onOpenSchoolWorkspace(school)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-brand-secondary hover:brightness-110 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Open Workspace</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/40 dark:border-slate-800/40 text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                <th className="pb-3 pl-2">School Name</th>
                <th className="pb-3">Subdomain</th>
                <th className="pb-3">Code</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredSchools.map((school) => (
                <tr key={school.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 pl-2 font-bold text-slate-900 dark:text-white font-display">{school.name}</td>
                  <td className="py-3 font-mono text-xs text-brand-secondary">{school.domain}</td>
                  <td className="py-3 font-mono text-xs text-slate-400">{school.code}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      school.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {school.status}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <button
                      onClick={() => onOpenSchoolWorkspace(school)}
                      className="px-3 py-1 text-xs font-bold text-white bg-brand-secondary hover:brightness-110 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                    >
                      Open Workspace <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create School Modal */}
      <CreateSchoolModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        newSchoolName={newSchoolName}
        setNewSchoolName={setNewSchoolName}
        newSchoolDomain={newSchoolDomain}
        setNewSchoolDomain={setNewSchoolDomain}
        newSchoolCode={newSchoolCode}
        setNewSchoolCode={setNewSchoolCode}
        handleCreateSchool={handleCreateSchool}
      />
    </div>
  )
}
