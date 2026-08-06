'use client'

// House System tab — house cards (name, theme color, captains) plus the
// "Add House" dialog. Owns its local newHouse state and wires the create
// handler to store.addHouse.

import { useState } from 'react'
import { ShieldCheck, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { toast } from 'sonner'
import { SettingsTab } from './shared'

const DEFAULT_HOUSE = {
  name: '',
  color: '#10b981',
  captain: '',
  viceCaptain: '',
}

export function HousesTab() {
  const store = useSchoolSettingsStore()
  const [addHouseOpen, setAddHouseOpen] = useState(false)
  const [newHouse, setNewHouse] = useState({ ...DEFAULT_HOUSE })

  const handleCreateHouse = () => {
    if (!newHouse.name.trim()) {
      toast.error('Please enter house name.')
      return
    }
    store.addHouse({
      name: newHouse.name,
      color: newHouse.color,
      captain: newHouse.captain,
      viceCaptain: newHouse.viceCaptain,
    })
    toast.success(`House "${newHouse.name}" created!`)
    setAddHouseOpen(false)
    setNewHouse({ ...DEFAULT_HOUSE })
  }

  return (
    <>
      <SettingsTab
        icon={ShieldCheck}
        title="House System & Captains"
        description="School house names, theme colors, and student house leadership appointments."
        action={
          <Button size="sm" onClick={() => setAddHouseOpen(true)} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
            <Plus className="h-3.5 w-3.5" /> Add House
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {store.houses.map((hs) => (
            <div key={hs.id} className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-2xs" style={{ borderLeftWidth: '4px', borderLeftColor: hs.color }}>
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-foreground">{hs.name} House</p>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: hs.color }} />
              </div>
              <div className="text-[11px] space-y-1 text-muted-foreground border-t border-border/50 pt-2">
                <p>Captain: <strong className="text-foreground">{hs.captain || 'Unassigned'}</strong></p>
                <p>Vice Captain: <span>{hs.viceCaptain || 'Unassigned'}</span></p>
              </div>
            </div>
          ))}
        </div>
      </SettingsTab>

      {/* DIALOG: ADD HOUSE */}
      <Dialog open={addHouseOpen} onOpenChange={setAddHouseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Create School House
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold mb-1 block">House Name</Label>
              <Input
                value={newHouse.name}
                onChange={(e) => setNewHouse({ ...newHouse, name: e.target.value })}
                placeholder="Kalam / Shivaji"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1 block">Theme Color (Hex)</Label>
              <Input
                type="color"
                value={newHouse.color}
                onChange={(e) => setNewHouse({ ...newHouse, color: e.target.value })}
                className="h-9 p-1 cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddHouseOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateHouse} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Create House
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
