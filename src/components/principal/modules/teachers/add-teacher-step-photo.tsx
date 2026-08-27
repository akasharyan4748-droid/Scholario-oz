'use client'

import { useRef, useState } from 'react'
import { Camera, Upload, Trash2, FileSignature, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AddTeacherForm } from './add-teacher-data'

type SetF = (key: string, val: any) => void

interface Props {
  form: AddTeacherForm
  setF: SetF
}

/**
 * Photo + Signature upload step.
 * Minimal design — small upload areas, preview, replace/remove actions.
 * Matches the Admission module's clean aesthetic.
 */
export function Step5PhotoSignature({ form, setF }: Props) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const signInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setF('photoDataUrl', reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setF('signatureDataUrl', reader.result as string)
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setF('photoDataUrl', '')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const removeSignature = () => {
    setF('signatureDataUrl', '')
    if (signInputRef.current) signInputRef.current.value = ''
  }

  return (
    <div className="space-y-5">
      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} />
      <input ref={signInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleSignatureChange} />

      {/* Photo Upload */}
      <div>
        <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Photograph</p>
        <div className="flex items-center gap-4">
          {/* Preview area */}
          <div className="shrink-0">
            {form.photoDataUrl ? (
              <div className="relative">
                <img src={form.photoDataUrl} alt="Teacher photo" className="h-24 w-24 rounded-lg object-cover border border-border" />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/20">
                <Camera className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} className="text-xs h-8 gap-1.5 w-fit">
              <Upload className="h-3.5 w-3.5" />
              {form.photoDataUrl ? 'Replace Photo' : 'Upload Photo'}
            </Button>
            {form.photoDataUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={removePhoto} className="text-xs h-8 gap-1.5 w-fit text-rose-600 hover:text-rose-700">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Signature Upload */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Signature</p>
        <div className="flex items-center gap-4">
          {/* Preview area */}
          <div className="shrink-0">
            {form.signatureDataUrl ? (
              <div className="relative">
                <img src={form.signatureDataUrl} alt="Signature" className="h-20 w-32 rounded-lg object-contain border border-border bg-white" />
              </div>
            ) : (
              <div className="h-20 w-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/20">
                <FileSignature className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => signInputRef.current?.click()} className="text-xs h-8 gap-1.5 w-fit">
              <Upload className="h-3.5 w-3.5" />
              {form.signatureDataUrl ? 'Replace Signature' : 'Upload Signature'}
            </Button>
            {form.signatureDataUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={removeSignature} className="text-xs h-8 gap-1.5 w-fit text-rose-600 hover:text-rose-700">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
