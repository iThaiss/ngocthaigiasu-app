'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CalendarEvent {
  id: string
  date: number
  month: number
  year: number
  title: string
  type: 'exam' | 'deadline' | 'class'
  subject: string
}

const NOW = new Date()
const CY = NOW.getFullYear()
const CM = NOW.getMonth()

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', date: 5,  month: CM, year: CY, title: 'Luyện tập Toán 12', type: 'class', subject: 'math' },
  { id: '2', date: 12, month: CM, year: CY, title: 'Nộp bài tập Lý', type: 'deadline', subject: 'physics' },
  { id: '3', date: 15, month: CM, year: CY, title: 'Ôn tập Tiếng Anh B1', type: 'class', subject: 'english' },
  { id: '4', date: 18, month: CM, year: CY, title: 'Nộp bài đọc IELTS', type: 'deadline', subject: 'english' },
  { id: '5', date: 20, month: CM, year: CY, title: 'Lịch học online', type: 'class', subject: 'all' },
  { id: '6', date: 22, month: CM, year: CY, title: 'Luyện đề Toán học', type: 'class', subject: 'math' },
  { id: '7', date: 25, month: CM, year: CY, title: 'Ôn tập ngữ pháp tenses', type: 'class', subject: 'english' },
  { id: '8', date: 28, month: CM, year: CY, title: 'Deadline tổng kết tuần', type: 'deadline', subject: 'all' },
]

const TYPE_STYLES: Record<string, string> = {
  exam:     'bg-red-500/15 text-red-600 dark:text-red-400',
  deadline: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  class:    'bg-green-500/15 text-green-600 dark:text-green-400',
}

const TYPE_LABEL: Record<string, string> = {
  exam: 'Thi thử',
  deadline: 'Deadline',
  class: 'Lịch học',
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

export default function SchedulePage() {
  const [year, setYear] = useState(CY)
  const [month, setMonth] = useState(CM)
  const [activeSubject, setActiveSubject] = useState<string | null>(null)

  useEffect(() => {
    // Read from localStorage on mount
    const saved = localStorage.getItem('ngocthai_subject') || 'math'
    setActiveSubject(saved)
  }, [])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Filter events by selected subject AND current calendar month/year
  const eventsThisMonth = MOCK_EVENTS.filter((e) => {
    const matchesMonth = e.month === month && e.year === year
    const matchesSubject = activeSubject ? (e.subject === activeSubject || e.subject === 'all') : true
    return matchesMonth && matchesSubject
  })

  const eventsByDate: Record<number, CalendarEvent[]> = {}
  eventsThisMonth.forEach((e) => {
    eventsByDate[e.date] = eventsByDate[e.date] ? [...eventsByDate[e.date], e] : [e]
  })

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Filter upcoming events by current date AND active subject
  const upcoming = [...MOCK_EVENTS]
    .filter((e) => {
      const d = new Date(e.year, e.month, e.date)
      const isUpcoming = d >= new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate())
      const matchesSubject = activeSubject ? (e.subject === activeSubject || e.subject === 'all') : true
      return isUpcoming && matchesSubject
    })
    .sort((a, b) => new Date(a.year, a.month, a.date).getTime() - new Date(b.year, b.month, b.date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" /> Lịch học tập
        </h1>
        <p className="text-muted-foreground mt-1">
          Lịch thi, deadline môn học: <strong className={activeSubject === 'english' ? 'text-rose-500' : 'text-purple-500'}>{activeSubject === 'english' ? 'Tiếng Anh' : 'Toán học'}</strong>
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  {MONTH_NAMES[month]} {year}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />
                  const isToday = day === NOW.getDate() && month === CM && year === CY
                  const dayEvents = eventsByDate[day] ?? []
                  return (
                    <div
                      key={day}
                      className={cn(
                        'relative flex flex-col items-center rounded-md p-1 min-h-[56px] text-sm border border-border/20',
                        isToday && 'bg-primary text-primary-foreground font-bold border-primary',
                        !isToday && 'hover:bg-muted transition-colors',
                      )}
                    >
                      <span className="text-xs font-semibold">{day}</span>
                      {dayEvents.slice(0, 2).map((e) => (
                        <span
                          key={e.id}
                          className={cn('mt-1 w-full truncate rounded px-1.5 py-0.5 text-[9px] font-medium leading-none', TYPE_STYLES[e.type])}
                          title={e.title}
                        >
                          {e.title}
                        </span>
                      ))}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Sự kiện sắp tới</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Không có sự kiện sắp tới cho môn này.</p>
              ) : (
                upcoming.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold', TYPE_STYLES[e.type])}>
                      {e.date}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate leading-tight">{e.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {e.date}/{e.month + 1}/{e.year}
                        </span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1 border-0 bg-muted/65 text-muted-foreground font-medium">
                          {TYPE_LABEL[e.type]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Notice */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4 text-sm text-blue-700 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0" />
        <span>Lịch thi, thời hạn nộp bài của lớp học offline và trực tuyến sẽ được tự động đồng bộ hàng tuần.</span>
      </div>
    </div>
  )
}
