'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { type CropRect, type Mode } from './types'
import { hasGetUserMedia } from './utils'
import { drawMainCanvas, drawPreviewCanvas, exportCroppedImage } from './draw'
import { computeInitialCrop } from './cropUtils'
import { useCamera } from './useCamera'
import { useFileUpload } from './useFileUpload'
import { useCropInteraction } from './useCropInteraction'

/**
 * Orchestrates all state + handlers for the PhotoStep photo editor.
 *
 * Composes three focused sub-hooks:
 *  - useCamera — live getUserMedia feed + frame capture
 *  - useFileUpload — JPG/PNG ≤5MB upload + decode
 *  - useCropInteraction — pointer-driven move/resize on the crop rect
 *
 * Owns the cross-cutting state (mode, capturedImage, crop, rotation, applied)
 * plus rotation/retake/apply/export handlers. Returns refs + state + handlers
 * consumed by the PhotoStep UI sub-components.
 */
export function usePhotoEditor(
  photoDataUrl: string | null,
  onChange: (dataUrl: string | null) => void
) {
  const [mode, setMode] = useState<Mode>('empty')
  const [capturedImage, setCapturedImage] = useState<HTMLImageElement | null>(null)
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 })
  const [rotation, setRotation] = useState(0)
  const [applied, setApplied] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initRef = useRef(false)

  // ---- Helpers ----
  const initCropForImage = useCallback((img: HTMLImageElement, rot: number) => {
    setCrop(computeInitialCrop(img, rot))
  }, [])

  // Shared post-load routine: reset rotation/crop, swap into editing mode,
  // optionally toast a success message (suppressed on silent mount-loads).
  const ingestImage = useCallback(
    (img: HTMLImageElement, successToast?: string) => {
      setCapturedImage(img)
      setRotation(0)
      setApplied(false)
      initCropForImage(img, 0)
      setMode('editing')
      if (successToast) toast.success(successToast)
    },
    [initCropForImage]
  )

  const handleCaptured = useCallback(
    (img: HTMLImageElement) => ingestImage(img, 'Photo captured'),
    [ingestImage]
  )
  const handleUploaded = useCallback(
    (img: HTMLImageElement) => ingestImage(img, 'Image loaded'),
    [ingestImage]
  )

  const { cameraReady, startCamera, stopCamera, captureFrame } = useCamera({
    videoRef,
    streamRef,
    setMode,
    onCapture: handleCaptured,
  })

  const handleFileChange = useFileUpload({ onImageLoaded: handleUploaded })

  const { isDragging, onPointerDown, onPointerMove, onPointerUp } =
    useCropInteraction({
      canvasRef,
      crop,
      setCrop,
      hasImage: !!capturedImage,
    })

  const loadImageFromDataUrl = useCallback(
    (dataUrl: string, silent = false) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => ingestImage(img, silent ? undefined : 'Image loaded')
      img.onerror = () => toast.error('Failed to load image')
      img.src = dataUrl
    },
    [ingestImage]
  )

  // ---- Load existing photo on mount (if provided) ----
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    if (photoDataUrl) loadImageFromDataUrl(photoDataUrl, true)
    // intentional: run once on mount only
  }, [photoDataUrl, loadImageFromDataUrl])

  // ---- Redraw on relevant state changes ----
  useEffect(() => {
    if (mode === 'editing') {
      if (canvasRef.current && capturedImage) {
        drawMainCanvas(canvasRef.current, capturedImage, crop, rotation)
      }
      const id = requestAnimationFrame(() => {
        if (previewCanvasRef.current && canvasRef.current) {
          drawPreviewCanvas(previewCanvasRef.current, canvasRef.current, capturedImage, crop)
        }
      })
      return () => cancelAnimationFrame(id)
    }
  }, [mode, capturedImage, crop, rotation])

  // ---- Toolbar actions ----
  const rotateLeft = () => {
    if (!capturedImage) return
    const next = (rotation - 90 + 360) % 360
    setRotation(next)
    initCropForImage(capturedImage, next)
  }
  const rotateRight = () => {
    if (!capturedImage) return
    const next = (rotation + 90) % 360
    setRotation(next)
    initCropForImage(capturedImage, next)
  }

  const handleRetake = () => {
    stopCamera()
    setCapturedImage(null)
    setRotation(0)
    setCrop({ x: 0, y: 0, w: 0, h: 0 })
    setApplied(false)
    setMode('empty')
  }

  const handleReplace = () => handleRetake()

  const handleRemove = () => {
    onChange(null)
    handleRetake()
    toast.info('Photo removed')
  }

  const handleApply = useCallback(() => {
    if (!capturedImage || !canvasRef.current) {
      toast.error('No photo to apply')
      return
    }
    const dataUrl = exportCroppedImage(canvasRef.current, crop)
    if (!dataUrl) {
      toast.error('Crop region is invalid')
      return
    }
    onChange(dataUrl)
    setApplied(true)
    toast.success('Photo saved', {
      description: 'Passport-size image added to the admission record.',
    })
  }, [capturedImage, crop, onChange])

  const cameraSupported = hasGetUserMedia()

  return {
    mode,
    setMode,
    capturedImage,
    crop,
    rotation,
    cameraReady,
    isDragging,
    applied,
    videoRef,
    canvasRef,
    previewCanvasRef,
    fileInputRef,
    cameraSupported,
    startCamera,
    stopCamera,
    captureFrame,
    handleFileChange,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    rotateLeft,
    rotateRight,
    handleRetake,
    handleReplace,
    handleRemove,
    handleApply,
    loadImageFromDataUrl,
  }
}
