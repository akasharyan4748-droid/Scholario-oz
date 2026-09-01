'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { MAX_FILE_SIZE } from './types'

interface UseFileUploadArgs {
  /** Called after an uploaded file is decoded into an HTMLImageElement. */
  onImageLoaded: (img: HTMLImageElement) => void
}

/**
 * Returns a stable `handleFileChange` callback that validates a JPG/PNG file
 * (≤ 5 MB), reads it as a data URL, decodes to an HTMLImageElement, then fires
 * `onImageLoaded`. The native file input value is reset so the same file can
 * be re-selected later.
 */
export function useFileUpload({ onImageLoaded }: UseFileUploadArgs) {
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Only JPG and PNG files are allowed')
        e.target.value = ''
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size must be less than 5 MB')
        e.target.value = ''
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => onImageLoaded(img)
        img.onerror = () => toast.error('Failed to decode image file')
        img.src = reader.result as string
      }
      reader.onerror = () => toast.error('Failed to read file')
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [onImageLoaded]
  )

  return handleFileChange
}
