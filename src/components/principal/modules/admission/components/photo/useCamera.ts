'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { hasGetUserMedia } from './utils'
import type { Mode } from './types'

interface UseCameraArgs {
  videoRef: React.RefObject<HTMLVideoElement | null>
  streamRef: React.MutableRefObject<MediaStream | null>
  setMode: (mode: Mode) => void
  /** Called after a captured frame is decoded into an HTMLImageElement. */
  onCapture: (img: HTMLImageElement) => void
}

/**
 * Manages the live camera feed for the PhotoStep editor:
 *  - startCamera: requests user-facing getUserMedia stream and switches to 'camera' mode
 *  - captureFrame: grabs the current video frame (mirrored), decodes to image, fires onCapture
 *  - stopCamera: stops all tracks and clears the video srcObject
 *  - cleanup on unmount
 */
export function useCamera({ videoRef, streamRef, setMode, onCapture }: UseCameraArgs) {
  const [cameraReady, setCameraReady] = useState(false)

  const stopCamera = useCallback(() => {
    const stream = streamRef.current
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [streamRef, videoRef])

  useEffect(() => () => stopCamera(), [stopCamera])

  const startCamera = useCallback(async () => {
    if (!hasGetUserMedia()) {
      toast.error('Camera not supported on this browser. Use upload instead.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      setMode('camera')
      setCameraReady(false)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => setCameraReady(true)).catch(() => {})
          }
        }
      })
    } catch (err) {
      const e = err as DOMException
      if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
        toast.error('Camera permission denied. Allow camera access in your browser settings.')
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        toast.error('No camera device found on this machine.')
      } else if (e.name === 'NotReadableError') {
        toast.error('Camera is in use by another application. Close it and try again.')
      } else if (e.name === 'OverconstrainedError') {
        toast.error('No camera matches the requested constraints.')
      } else {
        toast.error('Unable to start camera: ' + (e.message || 'unknown error'))
      }
    }
  }, [setMode, streamRef, videoRef])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || !cameraReady) {
      toast.error('Camera is still warming up. Please wait a moment.')
      return
    }
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) {
      toast.error('Camera stream not ready')
      return
    }
    const temp = document.createElement('canvas')
    temp.width = w
    temp.height = h
    const tctx = temp.getContext('2d')
    if (!tctx) return
    // Mirror horizontally to match user-facing preview
    tctx.translate(w, 0)
    tctx.scale(-1, 1)
    tctx.drawImage(video, 0, 0, w, h)

    const dataUrl = temp.toDataURL('image/jpeg', 0.95)
    const img = new Image()
    img.onload = () => onCapture(img)
    img.onerror = () => toast.error('Failed to process captured frame')
    img.src = dataUrl
    stopCamera()
  }, [cameraReady, onCapture, stopCamera, videoRef])

  return { cameraReady, startCamera, stopCamera, captureFrame }
}
