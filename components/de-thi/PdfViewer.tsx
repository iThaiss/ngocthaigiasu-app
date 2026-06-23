'use client'

import { X, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface PdfViewerProps {
  open: boolean
  onClose: () => void
  pdfUrl: string
  title: string
}

function toEmbedUrl(url: string): string {
  // Google Drive: https://drive.google.com/file/d/FILE_ID/...
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
  }
  // Google Drive open link: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (openMatch) {
    return `https://drive.google.com/file/d/${openMatch[1]}/preview`
  }
  return url
}

export default function PdfViewer({ open, onClose, pdfUrl, title }: PdfViewerProps) {
  const embedUrl = toEmbedUrl(pdfUrl)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0">
          <DialogTitle className="text-base font-medium truncate pr-4">{title}</DialogTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" title="Mở trong tab mới">
                <Maximize2 className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            title={title}
            allow="autoplay"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
