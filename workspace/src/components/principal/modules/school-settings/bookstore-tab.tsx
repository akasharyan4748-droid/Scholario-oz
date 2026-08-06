'use client'

// Book Store tab — book inventory cards with delete action, plus the
// "Add Book to Store" dialog. Owns its local newBook state and wires
// create/remove handlers to store.addBook / store.removeBook.

import { useState } from 'react'
import { ShoppingBag, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { toast } from 'sonner'
import { SettingsTab } from './shared'

const DEFAULT_BOOK = {
  classId: 'C05',
  className: 'Class 2',
  bookName: '',
  publisher: '',
  category: 'Textbook',
  price: 150,
  stock: 50,
  isMandatory: true,
}

export function BookstoreTab() {
  const store = useSchoolSettingsStore()
  const [addBookOpen, setAddBookOpen] = useState(false)
  const [newBook, setNewBook] = useState({ ...DEFAULT_BOOK })

  const handleCreateBook = () => {
    if (!newBook.bookName.trim() || !newBook.publisher.trim()) {
      toast.error('Please fill book name and publisher.')
      return
    }
    store.addBook({
      ...newBook,
      price: Number(newBook.price) || 0,
      stock: Number(newBook.stock) || 0,
    })
    toast.success(`Book "${newBook.bookName}" added to Bookstore repository!`)
    setAddBookOpen(false)
    setNewBook({ ...DEFAULT_BOOK })
  }

  return (
    <>
      <SettingsTab
        icon={ShoppingBag}
        title="Book Store Master Repository"
        description="Books sold by school. Auto-populated during student admissions & kit fee calculation."
        action={
          <Button size="sm" onClick={() => setAddBookOpen(true)} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
            <Plus className="h-3.5 w-3.5" /> Add Book to Store
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {store.bookStore.map((book) => (
            <div key={book.id} className="p-4 rounded-xl border border-border bg-card space-y-2 relative shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="secondary" className="text-[9px] mb-1">{book.className}</Badge>
                  <h4 className="font-bold text-xs text-foreground">{book.bookName}</h4>
                  <p className="text-[11px] text-muted-foreground">{book.publisher} · {book.category}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-rose-600"
                  onClick={() => store.removeBook(book.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[11px]">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{book.price}</span>
                <span className="text-muted-foreground">Stock: <strong>{book.stock}</strong></span>
                {book.isMandatory ? (
                  <Badge className="text-[9px] bg-emerald-100 text-emerald-800 border-none">Mandatory</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px]">Optional</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </SettingsTab>

      {/* DIALOG: ADD BOOK TO STORE */}
      <Dialog open={addBookOpen} onOpenChange={setAddBookOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ShoppingBag className="h-5 w-5 text-emerald-600" /> Add Book to Store
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a textbook or workbook to the school bookstore repository.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold mb-1 block">Target Class</Label>
              <Select
                value={newBook.className}
                onValueChange={(val) => setNewBook({ ...newBook, className: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {store.academics.classes.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1 block">Book Title</Label>
              <Input
                value={newBook.bookName}
                onChange={(e) => setNewBook({ ...newBook, bookName: e.target.value })}
                placeholder="NCERT Physics Class 11"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold mb-1 block">Publisher</Label>
                <Input
                  value={newBook.publisher}
                  onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                  placeholder="NCERT / Oxford"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1 block">Price (₹)</Label>
                <Input
                  type="number"
                  value={newBook.price}
                  onChange={(e) => setNewBook({ ...newBook, price: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
              <div>
                <p className="font-bold text-xs">Mandatory Kit Item</p>
                <p className="text-[10px] text-muted-foreground">Auto-selected during student admission</p>
              </div>
              <Switch
                checked={newBook.isMandatory}
                onCheckedChange={(chk) => setNewBook({ ...newBook, isMandatory: chk })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBookOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBook} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Save Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
