'use client'

import {
  Search, User, Users, GraduationCap, School, BookOpen, MessageSquare, FileText,
  Megaphone, BookMarked, IndianRupee, Sparkles, Settings, LogOut,
} from 'lucide-react'

export function renderItemIcon(iconName: string) {
  switch (iconName) {
    case 'User':
      return <User className="h-4 w-4" />
    case 'Users':
      return <Users className="h-4 w-4" />
    case 'GraduationCap':
      return <GraduationCap className="h-4 w-4" />
    case 'School':
      return <School className="h-4 w-4" />
    case 'BookOpen':
      return <BookOpen className="h-4 w-4" />
    case 'MessageSquare':
      return <MessageSquare className="h-4 w-4" />
    case 'FileText':
      return <FileText className="h-4 w-4" />
    case 'Megaphone':
      return <Megaphone className="h-4 w-4" />
    case 'BookMarked':
      return <BookMarked className="h-4 w-4" />
    case 'IndianRupee':
      return <IndianRupee className="h-4 w-4" />
    case 'Sparkles':
      return <Sparkles className="h-4 w-4" />
    case 'Settings':
      return <Settings className="h-4 w-4" />
    case 'LogOut':
      return <LogOut className="h-4 w-4" />
    default:
      return <Search className="h-4 w-4" />
  }
}

export function getBadgeStyle(variant?: string) {
  switch (variant) {
    case 'success':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    case 'warning':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 'destructive':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    case 'info':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}
