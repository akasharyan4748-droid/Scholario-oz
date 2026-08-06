'use client'

import React from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'

interface LightboxProps {
  activeImage: string | null
  onClose: () => void
}

export function GalleryLightbox({ activeImage, onClose }: LightboxProps) {
  if (!activeImage) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="relative max-w-4xl w-full">
        <Image
          src={activeImage}
          alt="Gallery Preview"
          width={1200}
          height={800}
          className="w-full h-auto rounded-2xl object-contain max-h-[85vh]"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
