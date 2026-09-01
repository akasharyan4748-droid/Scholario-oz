'use client'

/**
 * CommunicationModule — Principal's Communication Center.
 *
 * Thin re-export of CommShell which orchestrates the 4-tab workspace:
 *   Announcements · Circulars · Compose · History
 *
 * Channels (Push/SMS/Email) live inside the Compose tab, not as
 * separate top-level tabs.
 */

export { CommShell as CommunicationModule } from './comm-shell'
