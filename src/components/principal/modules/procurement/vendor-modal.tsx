'use client'

import { motion } from 'framer-motion'
import { Truck, X, Star, Phone, Mail, AlertCircle, FileText, IndianRupee } from 'lucide-react'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Vendor } from '@/lib/mock/procurement'

interface Props {
  selectedVendor: Vendor | null
  onClose: () => void
}

export function VendorModal({ selectedVendor, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-2xl border border-border glass-strong shadow-premium-lg overflow-hidden"
      >
        {selectedVendor && (
          <>
            <div className={cn('bg-gradient-to-br p-5 text-white', selectedVendor.gradient)}>
              <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <Truck className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">{selectedVendor.name}</h2>
                  <p className="text-white/80 text-sm">{selectedVendor.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-0.5 text-xs"><Star className="h-3 w-3 fill-amber-300 text-amber-300" /> {selectedVendor.rating}</span>
                    <span className="rounded bg-white/15 px-1.5 py-0 text-[9px]">{selectedVendor.status}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card/40 p-3">
                  <p className="text-[10px] text-muted-foreground">Contact Person</p>
                  <p className="text-sm font-semibold">{selectedVendor.contact}</p>
                </div>
                <div className="rounded-xl border border-border bg-card/40 p-3">
                  <p className="text-[10px] text-muted-foreground">GSTIN</p>
                  <p className="text-sm font-mono">{selectedVendor.gstin}</p>
                </div>
              </div>
              <div className="space-y-2">
                <a href={`tel:${selectedVendor.phone}`} onClick={(e) => { e.preventDefault(); toast.info('Calling vendor') }} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-2.5 hover:bg-accent transition-colors">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedVendor.phone}</span>
                </a>
                <a href={`mailto:${selectedVendor.email}`} onClick={(e) => { e.preventDefault(); toast.info('Email client') }} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-2.5 hover:bg-accent transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedVendor.email}</span>
                </a>
              </div>
              <div className="grid grid-cols-3 gap-3 py-3 border-y border-border text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Orders</p>
                  <p className="font-display text-lg font-bold">{selectedVendor.totalOrders}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Value</p>
                  <p className="font-display text-lg font-bold">{formatINR(selectedVendor.totalValue, true)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">On-Time</p>
                  <p className="font-display text-lg font-bold text-emerald-600">{selectedVendor.onTimeRate}%</p>
                </div>
              </div>
              {selectedVendor.pendingPayment > 0 && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                  <span className="text-xs text-rose-700 dark:text-rose-300">Pending payment: <strong>{formatINR(selectedVendor.pendingPayment)}</strong></span>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { toast.success('PO drafted', { description: `New PO for ${selectedVendor.name}` }); onClose() }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-md">
                  <FileText className="h-4 w-4" /> Create PO
                </button>
                <button onClick={() => toast.success('Payment processed')} className="flex items-center justify-center rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
                  <IndianRupee className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
