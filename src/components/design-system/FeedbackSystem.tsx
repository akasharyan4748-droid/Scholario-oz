'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Inbox, Lock, RefreshCw } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionText, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="p-3.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mb-4">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export interface BannerAlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  onRetry?: () => void;
}

export function BannerAlert({ type, title, message, onRetry }: BannerAlertProps) {
  const styles = {
    info: 'bg-blue-50/80 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300',
    success: 'bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300',
    warning: 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300',
    error: 'bg-rose-50/80 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300',
  };

  const icons = {
    info: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
  };

  return (
    <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${styles[type]}`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div>
          <div className="text-xs font-semibold">{title}</div>
          {message && <div className="text-xs mt-0.5 opacity-90">{message}</div>}
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white/60 dark:bg-slate-800 hover:bg-white transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
}

export function PermissionDeniedState({ moduleName }: { moduleName?: string }) {
  return (
    <EmptyState
      icon={<Lock className="w-6 h-6 text-amber-500" />}
      title="Access Restricted"
      description={`You do not have permission to access the ${moduleName || 'requested'} workspace. Please contact your system administrator or principal.`}
    />
  );
}
