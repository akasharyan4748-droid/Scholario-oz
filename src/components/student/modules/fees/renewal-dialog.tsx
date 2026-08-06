'use client'

import {
  RefreshCw, Download, CheckCircle2, Smartphone, Banknote, Clock, UserCheck,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  RENEWAL_RECEIVERS,
  type RenewalStage,
  type RenewalStatus,
  type RenewalPayType,
  type RenewalReceiver,
  type RenewalReceiptData,
} from './data'

interface RenewalDialogProps {
  open: boolean
  stage: RenewalStage
  status: RenewalStatus
  payType: RenewalPayType
  receiver: RenewalReceiver
  receiptData: RenewalReceiptData
  method: string
  student: {
    name: string
    admissionNo: string
  }
  onOpenChange: (open: boolean) => void
  onPayTypeChange: (pt: RenewalPayType) => void
  onReceiverChange: (r: RenewalReceiver) => void
  onProcess: () => void
  onSimulateAccept: () => void
}

export function RenewalDialog({
  open, stage, status, payType, receiver, receiptData, method, student,
  onOpenChange, onPayTypeChange, onReceiverChange, onProcess, onSimulateAccept,
}: RenewalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-lg" showCloseButton={stage !== 'processing'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <RefreshCw className="h-4 w-4" />
            </div>
            Session 2025–2026 Re-Admission Renewal
          </DialogTitle>
          <DialogDescription>
            Promoted Class 11-A Annual Re-Admission Fee Payment
          </DialogDescription>
        </DialogHeader>

        {stage === 'form' && (
          <RenewalFormStage
            payType={payType}
            receiver={receiver}
            onPayTypeChange={onPayTypeChange}
            onReceiverChange={onReceiverChange}
            onCancel={() => onOpenChange(false)}
            onProcess={onProcess}
          />
        )}

        {stage === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
            <h3 className="font-bold text-base">Processing Re-Admission Renewal…</h3>
            <p className="text-xs text-muted-foreground">Setting up Session 2025–2026 records</p>
          </div>
        )}

        {stage === 'receipt' && (
          <RenewalReceiptStage
            receiptData={receiptData}
            status={status}
            student={student}
            onClose={() => onOpenChange(false)}
            onSimulateAccept={onSimulateAccept}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RenewalFormStage({
  payType, receiver, onPayTypeChange, onReceiverChange, onCancel, onProcess,
}: {
  payType: RenewalPayType
  receiver: RenewalReceiver
  onPayTypeChange: (pt: RenewalPayType) => void
  onReceiverChange: (r: RenewalReceiver) => void
  onCancel: () => void
  onProcess: () => void
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-indigo-300">Total Renewal Fee</p>
            <p className="font-display text-2xl font-extrabold text-indigo-400 mt-0.5">
              ₹65,000
            </p>
          </div>
          <Badge className="bg-indigo-600 text-white font-mono">Class 11-A</Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Includes Tuition Fee (₹58,000), Annual Development (₹5,000), and Re-Admission Fee (₹2,000).
        </p>
      </div>

      <div>
        <Label className="text-xs font-semibold mb-2 block">Choose Payment Mode</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPayTypeChange('online')}
            className={cn(
              'flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all gap-2 text-center',
              payType === 'online'
                ? 'border-indigo-500 bg-indigo-500/10 text-foreground font-bold'
                : 'border-border bg-card/40 hover:border-indigo-500/30 text-muted-foreground'
            )}
          >
            <Smartphone className="h-6 w-6 text-indigo-400" />
            <div className="text-xs">
              <p className="font-bold">Pay Online</p>
              <p className="text-[10px] text-muted-foreground">UPI / Card / NetBanking</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onPayTypeChange('cash')}
            className={cn(
              'flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all gap-2 text-center',
              payType === 'cash'
                ? 'border-amber-500 bg-amber-500/10 text-foreground font-bold'
                : 'border-border bg-card/40 hover:border-amber-500/30 text-muted-foreground'
            )}
          >
            <Banknote className="h-6 w-6 text-amber-400" />
            <div className="text-xs">
              <p className="font-bold">Pay Cash to Staff</p>
              <p className="text-[10px] text-muted-foreground">Submit to Teacher / Principal</p>
            </div>
          </button>
        </div>
      </div>

      {payType === 'cash' && (
        <div className="space-y-2 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3.5">
          <Label className="text-xs font-semibold text-amber-300">Select Cash Payment Receiver</Label>
          <select
            value={receiver}
            onChange={(e) => onReceiverChange(e.target.value as RenewalReceiver)}
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-amber-500"
          >
            {RENEWAL_RECEIVERS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground mt-1">
            Your request will be submitted to <span className="font-semibold text-foreground">{receiver}</span>. They will confirm your cash deposit and release the official receipt.
          </p>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={onProcess}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
        >
          {payType === 'online' ? 'Proceed to Online Payment' : 'Submit Cash Request'}
        </Button>
      </DialogFooter>
    </div>
  )
}

function RenewalReceiptStage({
  receiptData, status, student, onClose, onSimulateAccept,
}: {
  receiptData: RenewalReceiptData
  status: RenewalStatus
  student: { name: string; admissionNo: string }
  onClose: () => void
  onSimulateAccept: () => void
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <h4 className="font-bold text-sm">Session Renewal Acknowledgment</h4>
              <p className="text-[11px] text-muted-foreground">{receiptData.receiptNo}</p>
            </div>
          </div>
          <Badge variant={status === 'approved' ? 'default' : 'outline'} className={status === 'approved' ? 'bg-emerald-600' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'}>
            {receiptData.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Student:</span>
            <p className="font-semibold">{student.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Admission No:</span>
            <p className="font-mono font-semibold">{student.admissionNo}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Promoted Class:</span>
            <p className="font-semibold text-indigo-400">Class 11-A (2025–2026)</p>
          </div>
          <div>
            <span className="text-muted-foreground">Amount:</span>
            <p className="font-bold text-emerald-400">₹65,000</p>
          </div>
          <div>
            <span className="text-muted-foreground">Payment Mode:</span>
            <p className="font-semibold">{receiptData.mode}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Payment Receiver:</span>
            <p className="font-semibold">{receiptData.receiver}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Txn Ref ID:</span>
            <p className="font-mono text-[11px]">{receiptData.txnId}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Date:</span>
            <p className="font-semibold">{receiptData.date}</p>
          </div>
        </div>

        {status === 'pending_cash' && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
            <p className="text-amber-300 font-semibold flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Pending Cash Collection
            </p>
            <p className="text-muted-foreground text-[11px]">
              Please hand over ₹65,000 cash to <span className="text-foreground font-semibold">{receiptData.receiver}</span>. Once accepted in their portal, your session re-admission will be fully approved.
            </p>
            <Button
              size="sm"
              onClick={onSimulateAccept}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <UserCheck className="h-3.5 w-3.5" /> Simulate Staff Cash Acceptance
            </Button>
          </div>
        )}
      </div>

      <DialogFooter className="gap-2">
        <Button
          variant="outline"
          onClick={() => toast.success('Official Renewal Receipt Downloaded (PDF)')}
          className="flex-1"
        >
          <Download className="h-4 w-4" /> Download PDF
        </Button>
        <Button
          onClick={onClose}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
        >
          Close
        </Button>
      </DialogFooter>
    </div>
  )
}
