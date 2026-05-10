import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface LessonPlan {
  duration?: number
  title?: string
  objectives?: string[]
  theory?: string
  examples?: string
  exercises?: string
  summary?: string
  tips?: string
}

function buildPrintHtml(params: {
  title: string
  courseName: string
  duration: number
  plan: LessonPlan
}): string {
  const { title, courseName, duration, plan } = params
  const objectives = (plan.objectives ?? []).map((o) => `<p>• ${o}</p>`).join('')

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&display=swap">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
  <style>
    body { font-family: 'Be Vietnam Pro', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #111; }
    h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; margin-bottom: 4px; }
    .meta { color: #6b7280; font-size: 13px; margin-bottom: 28px; }
    .section { margin: 24px 0; }
    .section-title { background: #1e40af; color: white; padding: 8px 16px; border-radius: 6px; font-size: 15px; font-weight: 600; margin-bottom: 12px; }
    .theory-box { background: #eff6ff; border-left: 4px solid #1e40af; padding: 16px; margin: 12px 0; border-radius: 0 6px 6px 0; white-space: pre-wrap; line-height: 1.7; }
    .example-box { background: #fefce8; border-left: 4px solid #ca8a04; padding: 16px; margin: 12px 0; border-radius: 0 6px 6px 0; white-space: pre-wrap; line-height: 1.7; }
    .exercise-box { background: #f9fafb; border-left: 4px solid #16a34a; padding: 16px; margin: 8px 0; border-radius: 0 6px 6px 0; white-space: pre-wrap; line-height: 1.7; }
    .summary-box { background: #f0fdf4; border: 1px solid #86efac; padding: 14px; border-radius: 8px; white-space: pre-wrap; line-height: 1.7; }
    .tips-box { background: #fefce8; border: 1px solid #fde047; padding: 14px; border-radius: 8px; white-space: pre-wrap; line-height: 1.7; }
    @media print { body { padding: 20px; } @page { margin: 20mm; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Ngọc Thái Gia Sư | ${courseName} | ⏱ ${duration} phút</p>

  ${objectives ? `<div class="section">
    <div class="section-title">I. MỤC TIÊU</div>
    ${objectives}
  </div>` : ''}

  ${plan.theory ? `<div class="section">
    <div class="section-title">II. LÝ THUYẾT</div>
    <div class="theory-box">${plan.theory}</div>
  </div>` : ''}

  ${plan.examples ? `<div class="section">
    <div class="section-title">III. VÍ DỤ MINH HỌA</div>
    <div class="example-box">${plan.examples}</div>
  </div>` : ''}

  ${plan.exercises ? `<div class="section">
    <div class="section-title">IV. BÀI TẬP ÁP DỤNG</div>
    <div class="exercise-box">${plan.exercises}</div>
  </div>` : ''}

  ${plan.summary ? `<div class="section">
    <div class="section-title">V. TỔNG KẾT</div>
    <div class="summary-box">${plan.summary}</div>
  </div>` : ''}

  ${plan.tips ? `<div class="section">
    <div class="section-title">MẸO GHI NHỚ</div>
    <div class="tips-box">${plan.tips}</div>
  </div>` : ''}

  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/contrib/auto-render.min.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ]
      });
    });
  </script>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lessonId } = await req.json()
  if (!lessonId) return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(`
      id, title, lesson_plan,
      chapters ( name, courses ( name ) )
    `)
    .eq('id', lessonId)
    .single()

  if (error || !lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const plan = (lesson.lesson_plan ?? {}) as LessonPlan
  const chapter = lesson.chapters as unknown as { name: string; courses: { name: string } | null } | null
  const courseName = chapter?.courses?.name ?? ''
  const duration = plan.duration ?? 90

  const html = buildPrintHtml({
    title: lesson.title,
    courseName,
    duration,
    plan,
  })

  return NextResponse.json({ html })
}
