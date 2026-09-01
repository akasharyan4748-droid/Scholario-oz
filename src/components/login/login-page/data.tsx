import { User, BookOpen, ShieldCheck, Cloud } from 'lucide-react'
import type { Role } from '@/lib/store/auth-store'

export interface CredentialCard {
  role: Role
  title: string
  name: string
  email: string
  password: string
  icon: React.ReactNode
  gradient: string
  accent: string
  description: string
}

export const credentials: CredentialCard[] = [
  {
    role: 'principal',
    title: 'Principal',
    name: 'Dr. Ananya Iyer',
    email: 'principal@greenwood.edu.in',
    password: 'principal123',
    icon: <ShieldCheck className="h-5 w-5" />,
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'emerald',
    description: 'Full administrative control',
  },
  {
    role: 'teacher',
    title: 'Teacher',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@greenwood.edu.in',
    password: 'teacher123',
    icon: <BookOpen className="h-5 w-5" />,
    gradient: 'from-amber-500 to-orange-600',
    accent: 'amber',
    description: 'Classroom & academics',
  },
  {
    role: 'student',
    title: 'Student',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@greenwood.edu.in',
    password: 'student123',
    icon: <User className="h-5 w-5" />,
    gradient: 'from-violet-500 to-purple-600',
    accent: 'violet',
    description: 'Learning & performance',
  },
  {
    role: 'superadmin',
    title: 'Super Admin',
    name: 'Arjun Malhotra',
    email: 'admin@scholario.cloud',
    password: 'admin123',
    icon: <Cloud className="h-5 w-5" />,
    gradient: 'from-indigo-600 to-violet-700',
    accent: 'indigo',
    description: 'Platform console',
  },
]
