'use client'

import React from 'react'
import Image from 'next/image'
import type { GalleryCategory, GalleryItem } from '../types'

interface GallerySectionProps {
  schoolName: string
  galleryFilter: GalleryCategory
  setGalleryFilter: (filter: GalleryCategory) => void
  filteredGallery: GalleryItem[]
  setActiveImage: (image: string | null) => void
}

export function GallerySection({
  schoolName,
  galleryFilter,
  setGalleryFilter,
  filteredGallery,
  setActiveImage,
}: GallerySectionProps) {
  return (
    <section id="gallery" className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Campus Moments</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Life at {schoolName}</h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: 'all', label: 'All Photos' },
            { id: 'campus', label: 'Campus' },
            { id: 'academics', label: 'Academics & Labs' },
            { id: 'sports', label: 'Sports' },
            { id: 'events', label: 'Events' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setGalleryFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                galleryFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'border border-border bg-card/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveImage(item.image)}
              className="group relative rounded-2xl overflow-hidden border border-border/80 shadow-premium cursor-pointer bg-card"
            >
              <Image
                src={item.image}
                alt={item.title}
                width={600}
                height={400}
                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/80 px-2 py-0.5 rounded text-white">
                  {item.category}
                </span>
                <h4 className="font-display font-semibold text-sm mt-1">{item.title}</h4>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
