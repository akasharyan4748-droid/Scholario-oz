'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/store/auth-store'

const PublicWebsite = dynamic(() => import('@/components/public-website/public-website').then((m) => m.PublicWebsite), {
  loading: () => <LoadingSpinner />,
})
const LoginPage = dynamic(() => import('@/components/login/login-page').then((m) => m.LoginPage), {
  loading: () => <LoadingSpinner />,
})
const PlatformLanding = dynamic(() => import('@/components/superadmin/platform-landing').then((m) => m.PlatformLanding), {
  loading: () => <LoadingSpinner />,
})
const PrincipalPanel = dynamic(() => import('@/components/principal/principal-panel').then((m) => m.PrincipalPanel), {
  loading: () => <LoadingSpinner />,
})
const TeacherPanel = dynamic(() => import('@/components/teacher/teacher-panel').then((m) => m.TeacherPanel), {
  loading: () => <LoadingSpinner />,
})
const StudentPanel = dynamic(() => import('@/components/student/student-panel').then((m) => m.StudentPanel), {
  loading: () => <LoadingSpinner />,
})
const SuperAdminPanel = dynamic(() => import('@/components/superadmin/superadmin-panel').then((m) => m.SuperAdminPanel), {
  loading: () => <LoadingSpinner />,
})

function LoadingSpinner() {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse shadow-lg shadow-emerald-500/30" />
    </div>
  )
}

export default function Home() {
  const isAuthenticated = useAuth((s) => s.isAuthenticated)
  const user = useAuth((s) => s.user)
  const hydrated = useAuth((s) => s.hydrated)
  const [mounted, setMounted] = useState(false)

  // Unauthenticated view states: 'website' | 'portal' | 'platform'
  const [viewState, setViewState] = useState<'website' | 'portal' | 'platform'>('website')

  useEffect(() => {
    setMounted(true)
    useAuth.persist.rehydrate()
    useAuth.setState({ hydrated: true })
  }, [])

  // Handle URL hash or path parameters if needed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash === '#portal' || hash === '#login') {
        setViewState('portal')
      } else if (hash === '#platform' || hash === '#superadmin') {
        setViewState('platform')
      }
    }
  }, [])

  // Render a stable skeleton until mounted and hydrated.
  if (!mounted || !hydrated) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse shadow-lg shadow-emerald-500/30" />
      </div>
    )
  }

  // If user is logged in, show their dashboard directly
  if (isAuthenticated && user) {
    if (user.role === 'principal') return <PrincipalPanel />
    if (user.role === 'teacher') return <TeacherPanel />
    if (user.role === 'student') return <StudentPanel />
    if (user.role === 'superadmin') return <SuperAdminPanel />
  }

  // Unauthenticated public views
  if (viewState === 'portal') {
    return <LoginPage onBackToWebsite={() => setViewState('website')} />
  }

  if (viewState === 'platform') {
    return <PlatformLanding onBackToSchool={() => setViewState('website')} />
  }

  // Default: Public School Website for Demo School of Scholario
  return (
    <PublicWebsite
      onOpenPortal={() => setViewState('portal')}
      onOpenPlatform={() => setViewState('platform')}
    />
  )
}
