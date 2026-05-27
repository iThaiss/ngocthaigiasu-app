'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpen, Volume2, Plus, ExternalLink, Loader2, X } from 'lucide-react'
import { useTextSelection } from '@/hooks/useTextSelection'
import { cn } from '@/lib/utils'

interface DictionaryEntry {
  word: string
  phonetic?: string
  audio_url?: string
  definitions?: Array<{ pos: string; definition: string; example?: string }>
  synonyms?: string[]
  antonyms?: string[]
}

interface PopupState {
  entry: DictionaryEntry | null
  loading: boolean
  error: boolean
  x: number
  y: number
}

export default function DictionaryPopup() {
  const { selection, clearSelection } = useTextSelection()
  const [popup, setPopup] = useState<PopupState | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fetchController = useRef<AbortController | null>(null)

  // Fetch when selection changes
  useEffect(() => {
    if (!selection) {
      setPopup(null)
      return
    }

    // Position popup above the selection
    const { rect } = selection
    const x = rect.left + rect.width / 2 + window.scrollX
    const y = rect.top + window.scrollY - 8

    setPopup({ entry: null, loading: true, error: false, x, y })

    // Cancel previous request
    fetchController.current?.abort()
    fetchController.current = new AbortController()

    fetch(`/api/dictionary?word=${encodeURIComponent(selection.text)}`, {
      signal: fetchController.current.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.entry) {
          setPopup((p) => p ? { ...p, loading: false, error: true } : null)
          return
        }
        setPopup((p) => p ? { ...p, loading: false, entry: data.entry } : null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setPopup((p) => p ? { ...p, loading: false, error: true } : null)
        }
      })

    return () => {
      fetchController.current?.abort()
    }
  }, [selection])

  // Adjust popup position after render to keep it in viewport
  useEffect(() => {
    if (!popup || !popupRef.current) return
    const el = popupRef.current
    const box = el.getBoundingClientRect()
    const vw = window.innerWidth

    // Clamp horizontal
    if (box.right > vw - 8) {
      el.style.transform = `translateX(-${box.right - (vw - 8)}px) translateX(-50%)`
    } else if (box.left < 8) {
      el.style.transform = `translateX(${8 - box.left}px) translateX(-50%)`
    }
  }, [popup])

  const playAudio = () => {
    const url = popup?.entry?.audio_url
    if (!url) return
    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.src = url
    audioRef.current.play().catch(() => {})
  }

  if (!popup) return null

  return (
    <div
      ref={popupRef}
      className={cn(
        'fixed z-[9999] -translate-x-1/2 pointer-events-auto',
        'animate-in fade-in-0 zoom-in-95 duration-150'
      )}
      style={{
        left: popup.x,
        top: popup.y,
        transform: 'translateX(-50%) translateY(-100%)',
      }}
      onMouseDown={(e) => e.stopPropagation()} // prevent clearSelection trigger
    >
      {/* Arrow */}
      <div className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-3 h-3 rotate-45 bg-popover border-r border-b border-border" />

      <div className="relative min-w-[200px] max-w-[280px] rounded-xl border border-border bg-popover text-popover-foreground shadow-lg shadow-black/10 p-3">
        {/* Close */}
        <button
          onClick={clearSelection}
          className="absolute top-2 right-2 p-0.5 rounded text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>

        {popup.loading && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Đang tra từ…</span>
          </div>
        )}

        {!popup.loading && popup.error && (
          <div className="py-2 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Không tìm thấy <strong>&ldquo;{selection?.text}&rdquo;</strong>
            </p>
          </div>
        )}

        {!popup.loading && popup.entry && (
          <>
            {/* Word + phonetic + audio */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-sm">{popup.entry.word}</p>
                {popup.entry.phonetic && (
                  <p className="text-xs text-muted-foreground">{popup.entry.phonetic}</p>
                )}
              </div>
              {popup.entry.audio_url && (
                <button
                  onClick={playAudio}
                  className="shrink-0 p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                  title="Phát âm"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Definitions (max 3) */}
            <div className="space-y-1.5 mb-2">
              {(popup.entry.definitions ?? []).slice(0, 3).map((d, i) => (
                <div key={i} className="text-xs">
                  {d.pos && (
                    <span className="mr-1 inline-block rounded px-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary">
                      {d.pos}
                    </span>
                  )}
                  <span className="text-foreground/80">{d.definition}</span>
                  {d.example && (
                    <p className="mt-0.5 text-muted-foreground italic">&ldquo;{d.example}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>

            {/* Synonyms */}
            {(popup.entry.synonyms?.length ?? 0) > 0 && (
              <div className="mb-2">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1">Syn:</span>
                {(popup.entry.synonyms ?? []).slice(0, 4).map((s) => (
                  <span key={s} className="inline-block mr-1 text-xs text-emerald-600 dark:text-emerald-400">
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-border">
              <button
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                onClick={() => {
                  // TODO: open "add to vocab set" modal
                  clearSelection()
                }}
              >
                <Plus className="h-3 w-3" />
                Thêm vào bộ từ
              </button>
              <a
                href={`/vocabulary?search=${encodeURIComponent(popup.entry.word)}`}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ml-auto"
              >
                <ExternalLink className="h-3 w-3" />
                Xem thêm
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
