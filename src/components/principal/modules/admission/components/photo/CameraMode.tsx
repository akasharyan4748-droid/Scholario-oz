'use client'

import { Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CameraModeProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  cameraReady: boolean
  onCapture: () => void
  onCancel: () => void
}

/**
 * Live camera feed UI: mirrored 4:3 video with a dashed oval face guide
 * overlay, a Live/Starting… state pill (top-left), and a centered capture
 * button + Cancel ghost button (bottom).
 */
export function CameraMode({
  videoRef,
  cameraReady,
  onCapture,
  onCancel,
}: CameraModeProps) {
  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} playsInline muted autoPlay className="block w-full aspect-[4/3] object-cover [transform:scaleX(-1)]" />
        {/* Face guide overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-[55%] h-[75%]" preserveAspectRatio="xMidYMid meet">
            <ellipse cx="50" cy="45" rx="32" ry="38" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6" strokeDasharray="2 2" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
            <line x1="0" y1="45" x2="100" y2="45" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
          </svg>
        </div>
        {/* Live state pill */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur px-2 py-0.5">
          <span className={cn('h-1.5 w-1.5 rounded-full', cameraReady ? 'bg-success animate-pulse' : 'bg-warning')} />
          <span className="text-[10px] font-medium text-white">{cameraReady ? 'Live' : 'Starting…'}</span>
        </div>
        {/* Capture + cancel */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-2 p-3 bg-gradient-to-t from-black/70 to-transparent">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-8 text-white hover:bg-white/15">
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button type="button" onClick={onCapture} disabled={!cameraReady} className="h-10 w-10 rounded-full p-0 bg-white text-primary shadow-lg hover:bg-white/90 disabled:opacity-60">
            <Camera className="h-4 w-4" />
          </Button>
          <div className="w-[60px]" aria-hidden />
        </div>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Center the face inside the oval guide, then capture
      </p>
    </div>
  )
}
