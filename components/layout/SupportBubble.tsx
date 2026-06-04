'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, MessageSquare, Phone, HelpCircle } from 'lucide-react'

export default function SupportBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end" ref={menuRef}>
      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-3 w-56 overflow-hidden rounded-2xl border border-border bg-popover/90 backdrop-blur-md p-2.5 shadow-2xl"
          >
            <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/85 border-b border-border/40 mb-1">
              Trợ giúp & Kết nối
            </div>

            <div className="space-y-1">
              {/* Chat cộng đồng */}
              <Link href="/chat" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-foreground">Chat cộng đồng</p>
                    <p className="text-[10px] text-muted-foreground">Giao lưu hỏi bài</p>
                  </div>
                </div>
              </Link>

              {/* Liên hệ hỗ trợ */}
              <Link href="/contact" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-foreground">Liên hệ hỗ trợ</p>
                    <p className="text-[10px] text-muted-foreground">Giải đáp tài khoản</p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/30 hover:opacity-95 transition-opacity"
        aria-label="Support menu"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="chat-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
