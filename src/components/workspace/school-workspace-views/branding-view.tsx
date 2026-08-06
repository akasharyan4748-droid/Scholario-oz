'use client';

import React from 'react';

// -------------------------------------------------------------
// 12. BRANDING
// -------------------------------------------------------------

export interface BrandingViewProps {
  schoolPrimaryColor: string;
  setSchoolPrimaryColor: (value: string) => void;
  schoolSecondaryColor: string;
  setSchoolSecondaryColor: (value: string) => void;
}

export function BrandingView({
  schoolPrimaryColor,
  setSchoolPrimaryColor,
  schoolSecondaryColor,
  setSchoolSecondaryColor,
}: BrandingViewProps) {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Tenant Color Swatches & Logos</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Primary Brand Swatch</span>
          <input
            type="color"
            value={schoolPrimaryColor}
            onChange={(e) => setSchoolPrimaryColor(e.target.value)}
            className="w-8 h-8 rounded border-0 cursor-pointer p-0"
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Secondary Accent Swatch</span>
          <input
            type="color"
            value={schoolSecondaryColor}
            onChange={(e) => setSchoolSecondaryColor(e.target.value)}
            className="w-8 h-8 rounded border-0 cursor-pointer p-0"
          />
        </div>
      </div>
    </div>
  );
}
