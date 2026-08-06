// Messaging module: static config (folder icons) used by the folders sidebar.

import { Inbox as InboxIcon, Star, Send, FileText, Archive } from 'lucide-react'

export const folderIcons: Record<string, React.ReactNode> = {
  Inbox: <InboxIcon className="h-4 w-4" />,
  Starred: <Star className="h-4 w-4" />,
  Sent: <Send className="h-4 w-4" />,
  Drafts: <FileText className="h-4 w-4" />,
  Archive: <Archive className="h-4 w-4" />,
}

// Simulated auto-reply phrases used when messaging staff/parent conversations.
export const autoReplies = [
  'Understood, Ma\'am. I\'ll get on it right away.',
  'Thank you for the update!',
  'Noted. Will coordinate and revert shortly.',
  'Sure, I\'ll prepare the report and share it by evening.',
]
