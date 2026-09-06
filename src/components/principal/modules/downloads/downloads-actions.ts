'use client'

/**
 * downloads-actions — ONE shared implementation of every Downloads document
 * action (Download / Print / Share / Favourite / Regenerate), used by the
 * document list rows, the Quick Access cards and the detail drawer.
 *
 * Every action is REAL:
 *   · Download → a genuine branded HTML document file (blob download).
 *   · Print    → opens a printable document window (new tab + print dialog).
 *   · Share    → Web Share API with clipboard fallback.
 *   · Favourite→ persisted pin (star state reflects it).
 *   · Regenerate→ re-issues a generated certificate with a new doc number.
 */

import { toast } from 'sonner'
import { useDownloadsStore, type DownloadDocument } from '@/lib/store/downloads-store'
import { useCertificatesStore } from '@/lib/store/certificates-store'
import { useSchoolProfile } from '@/lib/school-profile'
import {
  downloadHTMLFile, openPrintWindow, shareText, safeFileName,
} from '@/lib/download-file'
import { buildDocumentHTML } from '../certificates/cert-resolvers'
import { buildStaticDocHTML } from './static-doc-preview'

export function useDownloadsActions() {
  const download = useDownloadsStore((s) => s.download)
  const toggleFavourite = useDownloadsStore((s) => s.toggleFavourite)
  const generateDocument = useCertificatesStore((s) => s.generateDocument)
  const school = useSchoolProfile()

  /** The real document HTML for any library document (generated or static). */
  function documentHTML(doc: DownloadDocument): string | null {
    const cert = useCertificatesStore
      .getState()
      .documents.find((c) => `doc-gen-${c.id}` === doc.id)
    if (cert) return buildDocumentHTML(cert)
    if (doc.content) return buildStaticDocHTML(doc.content, school)
    return null
  }

  function handleDownload(doc: DownloadDocument) {
    const html = documentHTML(doc)
    if (!html) {
      toast.error('Document file unavailable', { description: doc.name })
      return
    }
    const filename = download(doc) // tracks usage + returns safe filename
    downloadHTMLFile(html, safeFileName(filename.replace(/\.[a-z]+$/i, ''), 'html'))
    toast.success('Download started', { description: `${doc.name} · ${doc.format}` })
  }

  function handlePrint(doc: DownloadDocument) {
    const html = documentHTML(doc)
    if (!html) {
      toast.error('Print preview unavailable', { description: doc.name })
      return
    }
    const w = openPrintWindow(html, doc.name)
    if (!w) {
      toast.error('Print blocked', {
        description: 'Allow pop-ups for this site to print documents.',
      })
    }
  }

  async function handleShare(doc: DownloadDocument) {
    const text = `${doc.name}${doc.docNumber ? ` (${doc.docNumber})` : ''} — ${school.name}`
    const result = await shareText(doc.name, text)
    if (result === 'copied') {
      toast.success('Copied to clipboard', { description: doc.name })
    } else if (result === 'shared') {
      toast.success('Shared', { description: doc.name })
    }
  }

  function handleFavourite(doc: DownloadDocument) {
    const next = toggleFavourite(doc.id)
    toast.success(
      next ? 'Pinned to favourites' : 'Removed from favourites',
      { description: doc.name },
    )
  }

  function handleRegenerate(doc: DownloadDocument) {
    const cert = useCertificatesStore
      .getState()
      .documents.find((c) => `doc-gen-${c.id}` === doc.id)
    if (!cert) {
      toast.info('Only generated documents can be regenerated', { description: doc.name })
      return
    }
    const newDoc = generateDocument({
      docType: cert.docType,
      templateId: cert.templateId,
      studentId: cert.studentId,
      studentName: cert.studentName,
      admissionNo: cert.admissionNo,
      class: cert.class,
      data: cert.data,
    })
    toast.success('Document regenerated', { description: newDoc.docNumber })
  }

  return {
    handleDownload,
    handlePrint,
    handleShare,
    handleFavourite,
    handleRegenerate,
  }
}
