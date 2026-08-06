'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/store/auth-store'
import type { GalleryCategory } from './types'
import { usePublicSchoolData, useAdmissionForm } from './use-public-website-data'
import { galleryItems } from './gallery-data'
import { PublicWebsiteHeader } from './sections/header'
import { HeroSection } from './sections/hero-section'
import { AboutSection } from './sections/about-section'
import { AcademicsSection } from './sections/academics-section'
import { FacilitiesSection } from './sections/facilities-section'
import { GallerySection } from './sections/gallery-section'
import { EventsSection } from './sections/events-section'
import { AdmissionsSection } from './sections/admissions-section'
import { PublicWebsiteFooter } from './sections/footer'
import { GalleryLightbox } from './sections/lightbox'
import type { PublicWebsiteProps } from './types'

export function PublicWebsite({ onOpenPortal, onOpenPlatform }: PublicWebsiteProps) {
  const { isAuthenticated, user, logout } = useAuth()
  void isAuthenticated
  void user
  void logout

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { schoolData, loading } = usePublicSchoolData()
  void loading

  // Gallery filter
  const [galleryFilter, setGalleryFilter] = useState<GalleryCategory>('all')

  // Lightbox modal for gallery
  const [activeImage, setActiveImage] = useState<string | null>(null)

  // Admission form hook
  const {
    admForm,
    setAdmForm,
    admSubmitting,
    admSuccess,
    setAdmSuccess,
    admError,
    handleAdmissionSubmit,
  } = useAdmissionForm()

  const schoolName = schoolData?.name || 'Demo School of Scholario'
  const city = schoolData?.city || 'Gurugram'
  const phone = schoolData?.phone || '+91 124 4567 800'
  const email = schoolData?.email || 'office@demoschool.edu'
  const address = schoolData?.address || '100 Knowledge Parkway, Sector 47, Gurugram'

  const filteredGallery = galleryFilter === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === galleryFilter)

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">

      <PublicWebsiteHeader
        schoolData={schoolData}
        schoolName={schoolName}
        city={city}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenPortal={() => onOpenPortal()}
      />

      <HeroSection
        schoolData={schoolData}
        schoolName={schoolName}
        onOpenPortal={() => onOpenPortal()}
      />

      <AboutSection schoolName={schoolName} />

      <AcademicsSection />

      <FacilitiesSection />

      <GallerySection
        schoolName={schoolName}
        galleryFilter={galleryFilter}
        setGalleryFilter={setGalleryFilter}
        filteredGallery={filteredGallery}
        setActiveImage={setActiveImage}
      />

      <EventsSection
        schoolData={schoolData}
        onOpenPortal={() => onOpenPortal()}
      />

      <AdmissionsSection
        schoolName={schoolName}
        admForm={admForm}
        setAdmForm={setAdmForm}
        admSubmitting={admSubmitting}
        admSuccess={admSuccess}
        setAdmSuccess={setAdmSuccess}
        admError={admError}
        handleAdmissionSubmit={handleAdmissionSubmit}
      />

      <PublicWebsiteFooter
        schoolName={schoolName}
        phone={phone}
        email={email}
        address={address}
        onOpenPortal={() => onOpenPortal()}
        onOpenPlatform={onOpenPlatform}
      />

      <GalleryLightbox activeImage={activeImage} onClose={() => setActiveImage(null)} />

    </div>
  )
}
