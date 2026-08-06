'use client'

import { GlassCard } from '@/components/shared/ui'
import { usePhotoEditor } from './photo/usePhotoEditor'
import { PhotoStepHeader } from './photo/StepHeader'
import { EmptyMode } from './photo/EmptyMode'
import { CameraMode } from './photo/CameraMode'
import { EditingMode } from './photo/EditingMode'
import { PreviewPanel } from './photo/PreviewPanel'
import type { PhotoStepProps } from './photo/types'

export function PhotoStep({ photoDataUrl, onChange }: PhotoStepProps) {
  const {
    mode,
    setMode,
    capturedImage,
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
  } = usePhotoEditor(photoDataUrl, onChange)

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Step Header — compact */}
      <PhotoStepHeader />

      <div className="grid lg:grid-cols-5 gap-4">
        {/* ============================================== */}
        {/* LEFT — main work area (60%)                   */}
        {/* ============================================== */}
        <div className="lg:col-span-3">
          <GlassCard hover={false} className="p-4">
            {/* EMPTY MODE — two compact choice cards */}
            {mode === 'empty' && (
              <EmptyMode
                photoDataUrl={photoDataUrl}
                cameraSupported={cameraSupported}
                onUploadClick={() => fileInputRef.current?.click()}
                onCameraClick={startCamera}
                onRemove={handleRemove}
              />
            )}

            {/* CAMERA MODE — live video feed */}
            {mode === 'camera' && (
              <CameraMode
                videoRef={videoRef}
                cameraReady={cameraReady}
                onCapture={captureFrame}
                onCancel={() => {
                  stopCamera()
                  setMode('empty')
                }}
              />
            )}

            {/* EDITING MODE — canvas with crop overlay + compact toolbar */}
            {mode === 'editing' && capturedImage && (
              <EditingMode
                canvasRef={canvasRef}
                isDragging={isDragging}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onRotateLeft={rotateLeft}
                onRotateRight={rotateRight}
                onRetake={handleRetake}
              />
            )}
          </GlassCard>
        </div>

        {/* ============================================== */}
        {/* RIGHT — preview + actions (40%)               */}
        {/* ============================================== */}
        <div className="lg:col-span-2">
          <PreviewPanel
            previewCanvasRef={previewCanvasRef}
            applied={applied}
            mode={mode}
            hasImage={!!capturedImage}
            hasPhotoOnFile={!!photoDataUrl}
            onApply={handleApply}
            onEditCurrent={() => loadImageFromDataUrl(photoDataUrl!, true)}
            onReplace={handleReplace}
          />
        </div>
      </div>
    </div>
  )
}
