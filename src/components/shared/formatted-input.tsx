'use client'

import React, { forwardRef, useRef, useImperativeHandle } from 'react'
import { Input } from '@/components/ui/input'
import {
  type FormatType,
  getFormattedValue,
  getCleanRawValue,
} from '@/lib/format'

export interface FormattedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string
  onChangeRaw?: (rawValue: string) => void
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  formatType?: FormatType
}

export const FormattedInput = forwardRef<HTMLInputElement, FormattedInputProps>(
  ({ value = '', onChangeRaw, onChange, formatType, className, placeholder, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null)
    useImperativeHandle(ref, () => internalRef.current!)

    const displayVal = getFormattedValue(value, formatType)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputEl = e.target
      const rawVal = getCleanRawValue(inputEl.value, formatType)

      // Notify caller with clean raw value (e.g. "9876543210")
      if (onChangeRaw) {
        onChangeRaw(rawVal)
      }

      if (onChange) {
        // Create synthetic event with raw value for standard form listeners
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: rawVal,
          },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }

    let defaultPlaceholder = placeholder
    if (!defaultPlaceholder && formatType) {
      switch (formatType) {
        case 'mobile':
          defaultPlaceholder = '98765 43210'
          break
        case 'aadhaar':
          defaultPlaceholder = '1234 5678 9012'
          break
        case 'bank':
          defaultPlaceholder = '1234 5678 9012 3456'
          break
        case 'ifsc':
          defaultPlaceholder = 'SBIN 0001234'
          break
        case 'employee':
          defaultPlaceholder = 'EMP-014'
          break
        case 'admission':
          defaultPlaceholder = 'ADM-2026-001'
          break
      }
    }

    return (
      <Input
        {...props}
        ref={internalRef}
        value={displayVal}
        onChange={handleChange}
        placeholder={defaultPlaceholder}
        className={className}
      />
    )
  }
)

FormattedInput.displayName = 'FormattedInput'
