import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DIFF_COLOR: Record<string, string> = {
  'Nhận biết': '#059669',
  'Thông hiểu': '#2563eb',
  'Vận dụng': '#d97706',
  'Vận dụng cao': '#dc2626',
}

function buildPdfHtml(params: {
  title: string
  subject: string
  duration: number
  courseName: string
  lessonHtml: string
}): string {
  const { title, subject, duration, courseName, lessonHtml } = params
  const subjectLabel = subject === 'toan_dai' ? 'Toán Đại số' : 'Toán Hình học'

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
<style>
  @page { margin: 20mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', serif; font-size: 13pt; color: #111; background: #fff; }
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 3px solid #7c3aed; margin-bottom: 18px; }
  .header-brand { display: flex; align-items: center; gap: 10px; }
  .header-logo { width: 42px; height: 42px; background: #7c3aed; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 14px; font-family: sans-serif; }
  .header-name { font-family: sans-serif; font-size: 15px; font-weight: 700; color: #7c3aed; }
  .header-url { font-family: sans-serif; font-size: 11px; color: #6b7280; }
  .header-meta { text-align: right; font-family: sans-serif; }
  .header-title { font-size: 14px; font-weight: 700; color: #111; max-width: 280px; }
  .header-sub { font-size: 11px; color: #6b7280; margin-top: 3px; }
  .badges { display: flex; gap: 6px; justify-content: flex-end; margin-top: 5px; }
  .badge { font-family: sans-serif; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
  .badge-purple { background: #ede9fe; color: #7c3aed; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-orange { background: #ffedd5; color: #c2410c; }
  .content { font-family: 'Times New Roman', serif; }
  h2 { font-family: sans-serif; font-size: 14pt; font-weight: 700; color: #111; margin: 20px 0 10px; padding-bottom: 5px; border-bottom: 1.5px solid #e5e7eb; }
  h3 { font-family: sans-serif; font-size: 12pt; font-weight: 600; color: #374151; margin: 14px 0 7px; }
  ul { padding-left: 20px; margin: 6px 0; }
  li { margin: 3px 0; }
  .lp-formula { background: #EBF5FB; border-left: 4px solid #2980B9; border-radius: 5px; padding: 10px 14px; margin: 8px 0; }
  .lp-formula .name { font-weight: 700; color: #1a56a6; margin-bottom: 4px; font-family: sans-serif; font-size: 11pt; }
  .lp-formula .note { font-size: 11pt; color: #6b7280; margin-top: 3px; }
  .lp-example { background: #FEF9E7; border-left: 4px solid #F39C12; border-radius: 5px; padding: 12px 14px; margin: 10px 0; }
  .lp-example .prob { font-weight: 600; margin-bottom: 6px; }
  .lp-example .sol { font-size: 12pt; color: #374151; }
  .lp-example .tip { font-size: 11pt; color: #92400e; background: #fde68a; border-radius: 4px; padding: 5px 9px; margin-top: 7px; }
  .lp-exercise { background: #fff; border: 1px solid #d1d5db; border-radius: 5px; padding: 12px 14px; margin: 8px 0; }
  .lp-exercise .qt { font-weight: 600; margin-bottom: 6px; }
  .lp-exercise .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 14px; font-size: 12pt; }
  .lp-exercise .opt.correct { font-weight: 700; color: #059669; }
  .lp-exercise .sol-box { font-size: 11pt; color: #6b7280; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #d1d5db; }
  .lp-summary { background: #f0fdf4; border: 1px solid #86efac; border-radius: 7px; padding: 14px; margin-top: 14px; }
  .lp-tips { background: #fefce8; border: 1px solid #fde047; border-radius: 7px; padding: 14px; margin-top: 10px; }
  .lp-math-block { display: block; text-align: center; margin: 7px 0; overflow-x: auto; }
  .katex-display { overflow-x: auto; overflow-y: hidden; }
  .footer { position: fixed; bottom: 10mm; left: 18mm; right: 18mm; font-family: sans-serif; font-size: 9pt; color: #9ca3af; display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 5px; }
  @media print {
    .footer { display: flex; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="header-brand">
      <div class="header-logo">NT</div>
      <div>
        <div class="header-name">Ngọc Thái Gia Sư</div>
        <div class="header-url">ngocthaigiasu.id.vn</div>
      </div>
    </div>
    <div class="header-meta">
      <div class="header-title">${title}</div>
      <div class="header-sub">${courseName}</div>
      <div class="badges">
        <span class="badge badge-purple">${subjectLabel}</span>
        <span class="badge badge-orange">⏱ ${duration} phút</span>
      </div>
    </div>
  </div>

  <div class="content">
    ${lessonHtml}
  </div>

  <div class="footer">
    <span>ngocthaigiasu.id.vn</span>
    <span class="pageNumber"></span>
  </div>

  <script>
    // Inject page numbers
    window.addEventListener('load', function() {
      var footer = document.querySelector('.footer .pageNumber')
      if (footer) footer.textContent = 'Trang 1'
    })
  </script>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { lessonId } = await req.json()
  if (!lessonId) return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(`
      id, title, topic, lesson_plan_html, lesson_plan,
      chapters ( name, subject, courses ( name ) )
    `)
    .eq('id', lessonId)
    .single()

  if (error || !lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const chapter = (lesson.chapters as unknown as { name: string; subject: string; courses: { name: string } | null }) ?? null
  const courseName = chapter?.courses?.name ?? ''
  const subject = chapter?.subject ?? 'toan_dai'
  const duration = (lesson.lesson_plan as { duration?: number } | null)?.duration ?? 90
  const lessonHtml = lesson.lesson_plan_html ?? '<p style="color:#999;text-align:center">Giáo án chưa được tạo</p>'

  const fullHtml = buildPdfHtml({
    title: lesson.title,
    subject,
    duration,
    courseName,
    lessonHtml,
  })

  let pdfBuffer: Buffer

  try {
    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    const page = await browser.newPage()
    await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 30000 })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
      displayHeaderFooter: true,
      footerTemplate: `<div style="width:100%;font-family:sans-serif;font-size:9px;color:#9ca3af;display:flex;justify-content:space-between;padding:0 18mm">
        <span>ngocthaigiasu.id.vn</span>
        <span>Trang <span class="pageNumber"></span>/<span class="totalPages"></span></span>
      </div>`,
      headerTemplate: '<div></div>',
    })
    await browser.close()
    pdfBuffer = Buffer.from(pdf)
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  const filename = `giao-an-${lesson.title.replace(/\s+/g, '-').toLowerCase()}.pdf`

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
}
