'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image as ImageIcon, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DropzoneProps {
  onFileAccepted: (file: File, preview: string) => void
  disabled?: boolean
}

export default function Dropzone({ onFileAccepted, disabled }: DropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    setError(null)
    if (rejectedFiles && (rejectedFiles as File[]).length > 0) {
      setError('Định dạng file phải là JPG, PNG hoặc WEBP và dưới 10MB.')
      return
    }
    const file = acceptedFiles[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    setFileName(file.name)
    onFileAccepted(file, url)
  }, [onFileAccepted])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled,
  })

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    setFileName(null)
    setError(null)
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer',
          isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-accent/50',
          disabled && 'opacity-50 cursor-not-allowed',
          preview && 'border-primary/30'
        )}
      >
        <input {...getInputProps()} />
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="rounded-lg object-contain max-h-48 w-full" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={clearFile}
              >
                <X className="h-3 w-3" />
              </Button>
              <p className="mt-2 text-center text-sm text-muted-foreground truncate">{fileName}</p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Kéo thả ảnh bài toán vào đây</p>
                <p className="text-sm text-muted-foreground mt-1">hoặc nhấn để chọn file</p>
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP — tối đa 10MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}
