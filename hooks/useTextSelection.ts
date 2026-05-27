'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

export interface SelectionInfo {
  text: string
  rect: DOMRect
}

/**
 * Lắng nghe sự kiện bôi đen văn bản. Trả về từ/cụm từ được chọn
 * và vị trí để hiển thị popup từ điển.
 *
 * Chỉ kích hoạt khi chọn 1–3 từ (không phải câu dài).
 */
export function useTextSelection() {
  const [selection, setSelection] = useState<SelectionInfo | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const clearSelection = useCallback(() => {
    setSelection(null)
  }, [])

  const handleMouseUp = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) {
        setSelection(null)
        return
      }

      const text = sel.toString().trim()

      // Chỉ xử lý 1–3 từ
      const wordCount = text.split(/\s+/).filter(Boolean).length
      if (!text || wordCount === 0 || wordCount > 3) {
        setSelection(null)
        return
      }

      // Chỉ lấy ký tự alphabet (không trigger cho số, toán tử...)
      if (!/^[a-zA-Z\s\-']+$/.test(text)) {
        setSelection(null)
        return
      }

      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setSelection({ text: text.toLowerCase(), rect })
    }, 200) // debounce 200ms
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchend', handleMouseUp)
    // Xóa selection khi click vào chỗ khác
    document.addEventListener('mousedown', clearSelection)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchend', handleMouseUp)
      document.removeEventListener('mousedown', clearSelection)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [handleMouseUp, clearSelection])

  return { selection, clearSelection }
}
