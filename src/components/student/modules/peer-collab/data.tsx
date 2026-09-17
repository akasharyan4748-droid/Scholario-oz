import { FileText, Image as ImageIcon, Link2, Palette } from 'lucide-react'

export type Tab = 'groups' | 'qa' | 'shares'

export const typeConfig = {
  Notes: { icon: <FileText className="h-3.5 w-3.5" />, color: 'bg-emerald-500/15 text-emerald-600' },
  Worksheet: { icon: <FileText className="h-3.5 w-3.5" />, color: 'bg-amber-500/15 text-amber-600' },
  Drawing: { icon: <Palette className="h-3.5 w-3.5" />, color: 'bg-rose-500/15 text-rose-600' },
  Photo: { icon: <ImageIcon className="h-3.5 w-3.5" />, color: 'bg-violet-500/15 text-violet-600' },
  Link: { icon: <Link2 className="h-3.5 w-3.5" />, color: 'bg-sky-500/15 text-sky-600' },
}
