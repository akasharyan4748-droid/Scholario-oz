'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/store/theme-store';
import {
  Bell,
  User,
  Settings,
  Moon,
  Sun,
  Menu,
  ChevronDown,
  LogOut,
  ShieldAlert,
  Info,
  Check,
  UserCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { ViewContext, ActiveSchool } from './sidebar';

interface TopbarProps {
  viewContext: ViewContext;
  activeSchool: ActiveSchool | null;
  onMobileMenuToggle: () => void;
  activeItemLabel: string;
}

export function Topbar({
  viewContext,
  activeSchool,
  onMobileMenuToggle,
  activeItemLabel,
}: TopbarProps) {
  const { theme, set: setTheme } = useTheme();
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Component states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Refs for click outside handling
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Click outside handling
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notifications
  const notifications = [
    {
      id: 1,
      type: 'alert',
      icon: ShieldAlert,
      title: 'Tenant Security Sync Validated',
      desc: 'Platform multi-tenant isolation rules verified cleanly.',
      time: '2m ago',
      unread: true,
    },
    {
      id: 2,
      type: 'info',
      icon: Info,
      title: 'Platform System Audit',
      desc: 'All 8 platform navigation services operating optimal.',
      time: '1h ago',
      unread: true,
    },
    {
      id: 3,
      type: 'system',
      icon: Sparkles,
      title: 'School Workspace Active',
      desc: viewContext === 'school-workspace' && activeSchool
        ? `Workspace loaded for ${activeSchool.name}.`
        : 'Scholario platform control online.',
      time: '3h ago',
      unread: false,
    },
  ];

  return (
    <header
      id="app-topbar"
      className="h-16 w-full flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-white/45 dark:bg-slate-900/40 backdrop-blur-md px-4 sm:px-6 relative z-90"
    >
      {/* Left side: Hamburger (Mobile) + Breadcrumb Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-black/20 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all focus-ring"
          aria-label="Toggle Mobile Sidebar Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Context Breadcrumb */}
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest">
            <span>Scholario OS</span>
            <span>/</span>
            {viewContext === 'school-workspace' && activeSchool ? (
              <span className="text-brand-secondary font-semibold flex items-center gap-1">
                <Building2 className="w-3 h-3 inline" />
                {activeSchool.name}
              </span>
            ) : (
              <span className="text-brand-secondary font-semibold">Platform</span>
            )}
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-white font-display tracking-tight leading-none mt-1">
            {activeItemLabel}
          </span>
        </div>
      </div>

      {/* Right side: Notifications, Theme Toggle, Profile Avatar & Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-black/20 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all focus-ring"
          aria-label="Toggle theme mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-black/20 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all focus-ring"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-brand-secondary border-2 border-white dark:border-slate-900" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 p-4 shadow-xl shadow-black/20 z-500"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                    Platform Notifications
                  </h4>
                  <span className="px-2 py-0.5 text-[9px] rounded bg-brand-primary/10 text-brand-primary font-bold">
                    2 UNREAD
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto no-scrollbar">
                  {notifications.map((notif) => {
                    const IconComponent = notif.icon;
                    return (
                      <div key={notif.id} className="py-2.5 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 p-1.5 rounded-lg transition-colors">
                        <span className={`p-1.5 rounded-lg shrink-0 ${notif.unread ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-none">
                              {notif.title}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                            {notif.desc}
                          </p>
                        </div>
                        {notif.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary shrink-0 mt-1.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar & Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/40 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800/50 cursor-pointer transition focus-ring"
            aria-label="Open Profile Menu"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 p-3 shadow-xl shadow-black/20 z-500"
              >
                {/* Profile briefing */}
                <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-display">
                    Super Admin
                  </p>
                  <p className="text-[10px] text-slate-500 truncate font-mono uppercase tracking-wider mt-0.5">
                    admin@scholario.com
                  </p>
                </div>

                {/* Preferences */}
                <div className="space-y-0.5">
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/45 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer">
                    <UserCheck className="w-3.5 h-3.5" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/45 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer">
                    <Settings className="w-3.5 h-3.5" />
                    Preferences
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2">
                  <button
                    onClick={() => setIsReducedMotion(!isReducedMotion)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/45 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
                  >
                    <span>Reduced Motion</span>
                    {isReducedMotion && <Check className="w-3 h-3 text-brand-secondary" />}
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2">
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition cursor-pointer text-left">
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}
