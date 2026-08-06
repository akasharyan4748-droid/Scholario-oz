'use client'

import React from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import type { AdmissionFormState } from '../use-public-website-data'

interface AdmissionsSectionProps {
  schoolName: string
  admForm: AdmissionFormState
  setAdmForm: React.Dispatch<React.SetStateAction<AdmissionFormState>>
  admSubmitting: boolean
  admSuccess: boolean
  setAdmSuccess: (success: boolean) => void
  admError: string
  handleAdmissionSubmit: (e: React.FormEvent) => void
}

export function AdmissionsSection({
  schoolName,
  admForm,
  setAdmForm,
  admSubmitting,
  admSuccess,
  setAdmSuccess,
  admError,
  handleAdmissionSubmit,
}: AdmissionsSectionProps) {
  return (
    <section id="admissions" className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          {/* Left Info */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Join Our Community</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Admission Inquiry</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We welcome prospective students for the upcoming academic session. Fill out the inquiry form to schedule a campus tour and interaction with our admissions counselor.
            </p>

            <div className="space-y-4 pt-4">
              {[
                { step: '01', title: 'Online Inquiry Form', desc: 'Submit your contact details and student information.' },
                { step: '02', title: 'Campus Visit & Counseling', desc: 'Tour our academic facilities and meet subject faculty.' },
                { step: '03', title: 'Interaction / Assessment', desc: 'Age-appropriate readiness evaluation for student.' },
                { step: '04', title: 'Document Verification', desc: 'Finalize enrollment and receive student portal credentials.' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="font-display font-bold text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0">
                    {s.step}
                  </span>
                  <div>
                    <h4 className="font-display font-bold text-sm">{s.title}</h4>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-7 glass-strong rounded-3xl p-6 sm:p-8 border border-border/80 shadow-premium-lg">
            {admSuccess ? (
              <div className="text-center py-12 space-y-4">
                <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="font-display font-bold text-2xl">Inquiry Submitted Successfully!</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Thank you for expressing interest in {schoolName}. Our admissions counselor will contact you via phone or email within 24 hours.
                </p>
                <button
                  onClick={() => setAdmSuccess(false)}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdmissionSubmit} className="space-y-4">
                <h3 className="font-display font-bold text-xl mb-2">Apply for Admission</h3>

                {admError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                    {admError}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      value={admForm.studentName}
                      onChange={(e) => setAdmForm({ ...admForm, studentName: e.target.value })}
                      placeholder="e.g. Ananya Roy"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Parent / Guardian Name *</label>
                    <input
                      type="text"
                      required
                      value={admForm.parentName}
                      onChange={(e) => setAdmForm({ ...admForm, parentName: e.target.value })}
                      placeholder="e.g. Rajesh Roy"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={admForm.phone}
                      onChange={(e) => setAdmForm({ ...admForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                    <input
                      type="email"
                      value={admForm.email}
                      onChange={(e) => setAdmForm({ ...admForm, email: e.target.value })}
                      placeholder="parent@example.com"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Grade Applying For</label>
                  <select
                    value={admForm.grade}
                    onChange={(e) => setAdmForm({ ...admForm, grade: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (Science)', 'Grade 11 (Commerce)', 'Grade 12'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Additional Notes / Questions</label>
                  <textarea
                    rows={3}
                    value={admForm.notes}
                    onChange={(e) => setAdmForm({ ...admForm, notes: e.target.value })}
                    placeholder="Any specific questions about curriculum, bus transport, or scholarship..."
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={admSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {admSubmitting ? 'Submitting Application...' : 'Submit Admission Inquiry'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
