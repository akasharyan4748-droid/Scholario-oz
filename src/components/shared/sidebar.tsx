'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Activity,
  FileText,
  Settings,
  GraduationCap,
  CalendarCheck,
  BookOpen,
  Library,
  Layers,
  Globe,
  Smartphone,
  Palette,
  Link,
  UserCheck,
  Bot,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowLeft,
  Sparkles,
  School
} from 'lucide-react';

export type ViewContext = 'platform' | 'school-workspace';

export interface ActiveSchool {
  id: string;
  name: string;
  domain: string;
  code: string;
  status: 'Active' | 'Archived' | 'Suspended';
}

interface SidebarProps {
  viewContext: ViewContext;
  setViewContext: (ctx: ViewContext) => void;
  activeSchool: ActiveSchool | null;
  setActiveSchool: (school: ActiveSchool | null) => void;
  activeItem: string;
  setActiveItem: (itemId: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({
  viewContext,
  setViewContext,
  activeSchool,
  setActiveSchool,
  activeItem,
  setActiveItem,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {

  // 1. Platform-level navigation items (STRICTLY required 8 modules)
  const platformNavItems = [
    { id: 'platform-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'platform-schools', label: 'Schools', icon: Building2 },
    { id: 'platform-users', label: 'Platform Users', icon: Users },
    { id: 'platform-billing', label: 'Billing', icon: CreditCard },
    { id: 'platform-analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'platform-monitoring', label: 'Monitoring', icon: Activity },
    { id: 'platform-audit-logs', label: 'Audit Logs', icon: FileText },
    { id: 'platform-settings', label: 'Platform Settings', icon: Settings },
  ];

  // 2. School Workspace-level navigation items
  const schoolWorkspaceNavItems = [
    { id: 'school-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'school-students', label: 'Students', icon: GraduationCap },
    { id: 'school-teachers', label: 'Teachers', icon: Users },
    { id: 'school-parents', label: 'Parents', icon: UserCheck },
    { id: 'school-attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'school-classes', label: 'Classes', icon: School },
    { id: 'school-fees', label: 'Fees', icon: CreditCard },
    { id: 'school-library', label: 'Library', icon: Library },
    { id: 'school-reports', label: 'Reports', icon: BarChart3 },
    { id: 'school-website-builder', label: 'Website Builder', icon: Globe },
    { id: 'school-app-builder', label: 'App Builder', icon: Smartphone },
    { id: 'school-branding', label: 'Branding', icon: Palette },
    { id: 'school-domains', label: 'Domains', icon: Link },
    { id: 'school-admissions', label: 'Admissions', icon: BookOpen },
    { id: 'school-settings', label: 'Settings', icon: Settings },
    { id: 'school-ai-assistant', label: 'AI Assistant', icon: Bot },
  ];

  const currentNavItems = viewContext === 'school-workspace' ? schoolWorkspaceNavItems : platformNavItems;

  const handleReturnToPlatform = () => {
    setViewContext('platform');
    setActiveItem('platform-schools');
  };

  return (
    <aside
      id="app-sidebar"
      className={`h-screen hidden md:flex flex-col shrink-0 border-r border-slate-200/50 dark:border-slate-800/50 bg-white/45 dark:bg-slate-900/40 backdrop-blur-md transition-all duration-300 relative z-100 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 h-16">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex flex-col select-none"
            >
              <span className="text-sm font-bold text-slate-900 dark:text-white font-display tracking-tight whitespace-nowrap">
                {viewContext === 'school-workspace' ? 'Demo School of Scholario' : 'Scholario Platform'}
              </span>
              <span className="text-[10px] text-brand-secondary font-semibold uppercase tracking-wider font-mono">
                {viewContext === 'school-workspace' ? 'Tenant Workspace' : 'Platform Control'}
              </span>
            </motion.div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute right-[-14px] top-4 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all z-200"
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Context Badge / Back to Platform Navigation Switcher */}
      {viewContext === 'school-workspace' && activeSchool ? (
        <div className="p-3 border-b border-slate-200/30 dark:border-slate-800/30 bg-brand-primary/5">
          {!isCollapsed ? (
            <div className="space-y-2">
              <button
                onClick={handleReturnToPlatform}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-brand-secondary" />
                <span>Return to Platform</span>
              </button>

              <div className="p-2.5 rounded-xl border border-brand-primary/20 bg-white/60 dark:bg-slate-950/40">
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                  Active Tenant
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white font-display truncate">
                  {activeSchool.name}
                </div>
                <div className="text-[10px] font-mono text-brand-secondary truncate">
                  {activeSchool.domain}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleReturnToPlatform}
              title="Return to Platform Overview"
              className="w-full flex justify-center py-2 text-brand-secondary hover:scale-110 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 py-2 border-b border-slate-200/30 dark:border-slate-800/30">
          {!isCollapsed && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
              Platform Modules
            </span>
          )}
        </div>
      )}

      {/* Navigation Group Scroller */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 no-scrollbar">
        <ul className="space-y-1">
          {currentNavItems.map((item) => {
            const isActive = activeItem === item.id;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer relative group ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/15 font-semibold border-l-2 border-emerald-500 rounded-r-xl rounded-l-xs shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 font-medium'
                  }`}
                  aria-label={`Navigate to ${item.label}`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                    }`}
                  />

                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="truncate text-left"
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {/* Tooltip on collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 transition-all origin-left duration-200 z-300 pointer-events-none">
                      <div className="bg-slate-950 text-white font-sans text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-800 shadow-xl whitespace-nowrap">
                        {item.label}
                      </div>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer Profile / Utility Panel */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0"
            >
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-display">
                Platform Admin
              </h5>
              <p className="text-[10px] text-slate-500 truncate font-mono uppercase tracking-wider">
                {viewContext === 'school-workspace' ? 'Tenant Workspace' : 'Super Admin'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </aside>
  );
}
