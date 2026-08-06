'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { libraryBooks } from '@/lib/mock/operations'
import { students } from '@/lib/mock/students'
import { toast } from 'sonner'

export function IssueBookDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [book, setBook] = useState('')
  const [student, setStudent] = useState('')
  const [days, setDays] = useState('14')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Book</DialogTitle>
          <DialogDescription>Issue a book to a student. Default due date is 14 days from today.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Book</Label>
            <Select value={book} onValueChange={setBook}>
              <SelectTrigger><SelectValue placeholder="Select book" /></SelectTrigger>
              <SelectContent>
                {libraryBooks.filter((b) => b.available > 0).slice(0, 6).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.title} ({b.available} avail)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Student</Label>
            <Select value={student} onValueChange={setStudent}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.slice(0, 8).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.admissionNo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Loan Period (days)</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['7', '14', '21', '30'].map((d) => <SelectItem key={d} value={d}>{d} days</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!book || !student) {
              toast.error('Please select both book and student')
              return
            }
            toast.success('Book issued successfully', { description: `Due in ${days} days · Loan ID: LON-${Date.now().toString().slice(-6)}` })
            setBook(''); setStudent('')
            onOpenChange(false)
          }}>Issue Book</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
