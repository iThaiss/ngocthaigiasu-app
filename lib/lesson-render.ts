import katex from 'katex'

function math(text: string, display = false): string {
  try { return katex.renderToString(text.trim(), { throwOnError: false, displayMode: display }) }
  catch { return `<code>${text}</code>` }
}

function renderText(text: string): string {
  if (!text) return ''
  let result = text
  result = result.replace(/\$\$([^$]+)\$\$/g, (_, m) =>
    `<span class="lp-math-block">${math(m, true)}</span>`
  )
  result = result.replace(/\$([^$\n]+)\$/g, (_, m) => math(m, false))
  result = result.replace(/\n/g, '<br>')
  return result
}

const DIFF_STYLE: Record<string, string> = {
  'Nhận biết': 'background:#d1fae5;color:#065f46',
  'Thông hiểu': 'background:#dbeafe;color:#1e40af',
  'Vận dụng': 'background:#ffedd5;color:#9a3412',
  'Vận dụng cao': 'background:#fee2e2;color:#991b1b',
}

function badge(level: string) {
  const s = DIFF_STYLE[level] || 'background:#f3f4f6;color:#374151'
  return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;${s}">${level}</span>`
}

export function renderLessonHTML(plan: {
  title?: string
  duration?: number
  objectives?: string[]
  theory?: {
    definitions?: { term: string; content: string }[]
    formulas?: { name: string; formula: string; note?: string }[]
    theorems?: { name: string; content: string }[]
  }
  examples?: { level: string; problem: string; solution: string; tip?: string }[]
  exercises?: {
    source?: string
    question_text: string
    option_a?: string; option_b?: string; option_c?: string; option_d?: string
    correct_answer?: string
    difficulty?: string
    solution?: string
  }[]
  summary?: string
  memory_tips?: string
}): string {
  const css = `
<style>
.lp{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.7;color:#1f2937;max-width:100%}
.lp h2{font-size:18px;font-weight:700;color:#111827;margin:24px 0 12px;padding-bottom:6px;border-bottom:2px solid #e5e7eb}
.lp h3{font-size:15px;font-weight:600;color:#374151;margin:16px 0 8px}
.lp ul{padding-left:20px;margin:8px 0}
.lp li{margin:4px 0}
.lp-formula{background:#EBF5FB;border-left:4px solid #2980B9;border-radius:6px;padding:12px 16px;margin:10px 0}
.lp-formula .name{font-weight:700;color:#1a56a6;margin-bottom:4px}
.lp-formula .note{font-size:13px;color:#6b7280;margin-top:4px}
.lp-example{background:#FEF9E7;border-left:4px solid #F39C12;border-radius:6px;padding:14px 16px;margin:12px 0}
.lp-example .prob{font-weight:600;margin-bottom:8px}
.lp-example .sol{font-size:14px;color:#374151}
.lp-example .tip{font-size:13px;color:#92400e;background:#fde68a;border-radius:4px;padding:6px 10px;margin-top:8px}
.lp-exercise{background:#fff;border:1px solid #d1d5db;border-radius:6px;padding:14px 16px;margin:10px 0}
.lp-exercise .qt{font-weight:600;margin-bottom:8px}
.lp-exercise .opts{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:14px}
.lp-exercise .opt{padding:2px 0}
.lp-exercise .opt.correct{font-weight:700;color:#059669}
.lp-exercise .sol-box{font-size:13px;color:#6b7280;margin-top:10px;padding-top:8px;border-top:1px dashed #d1d5db}
.lp-summary{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin-top:16px}
.lp-tips{background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:16px;margin-top:12px}
.lp-math-block{display:block;text-align:center;margin:8px 0;overflow-x:auto}
.katex-display{overflow-x:auto;overflow-y:hidden}
</style>`

  let html = `${css}<div class="lp">`

  // Objectives
  if (plan.objectives?.length) {
    html += `<h2>🎯 Mục tiêu bài học</h2><ul>`
    for (const o of plan.objectives) html += `<li>${renderText(o)}</li>`
    html += `</ul>`
  }

  // Theory
  const th = plan.theory
  if (th) {
    html += `<h2>📚 Lý thuyết</h2>`

    if (th.definitions?.length) {
      html += `<h3>Định nghĩa</h3>`
      for (const d of th.definitions) {
        html += `<div class="lp-formula"><div class="name">${d.term}</div><div>${renderText(d.content)}</div></div>`
      }
    }
    if (th.formulas?.length) {
      html += `<h3>Công thức</h3>`
      for (const f of th.formulas) {
        html += `<div class="lp-formula"><div class="name">${f.name}</div><div>${renderText(f.formula)}</div>`
        if (f.note) html += `<div class="note">${renderText(f.note)}</div>`
        html += `</div>`
      }
    }
    if (th.theorems?.length) {
      html += `<h3>Định lý</h3>`
      for (const t of th.theorems) {
        html += `<div class="lp-formula"><div class="name">${t.name}</div><div>${renderText(t.content)}</div></div>`
      }
    }
  }

  // Examples
  if (plan.examples?.length) {
    html += `<h2>✏️ Ví dụ minh họa</h2>`
    plan.examples.forEach((ex, i) => {
      html += `<div class="lp-example">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-weight:700;color:#92400e">Ví dụ ${i + 1}</span>
          ${badge(ex.level)}
        </div>
        <div class="prob">${renderText(ex.problem)}</div>
        <div class="sol"><strong>Giải:</strong><br>${renderText(ex.solution)}</div>`
      if (ex.tip) html += `<div class="tip">💡 Mẹo: ${renderText(ex.tip)}</div>`
      html += `</div>`
    })
  }

  // Exercises
  if (plan.exercises?.length) {
    html += `<h2>🧩 Bài tập luyện tập</h2>`
    plan.exercises.forEach((ex, i) => {
      const opts = [
        ex.option_a && { key: 'A', val: ex.option_a },
        ex.option_b && { key: 'B', val: ex.option_b },
        ex.option_c && { key: 'C', val: ex.option_c },
        ex.option_d && { key: 'D', val: ex.option_d },
      ].filter(Boolean) as { key: string; val: string }[]

      html += `<div class="lp-exercise">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-weight:700;color:#374151">Câu ${i + 1}</span>
          ${ex.difficulty ? badge(ex.difficulty) : ''}
        </div>
        <div class="qt">${renderText(ex.question_text)}</div>`

      if (opts.length) {
        html += `<div class="opts">`
        for (const o of opts) {
          const isCorrect = o.key === ex.correct_answer
          html += `<div class="opt${isCorrect ? ' correct' : ''}">${isCorrect ? '✓' : ''} <strong>${o.key}.</strong> ${renderText(o.val)}</div>`
        }
        html += `</div>`
      }

      if (ex.correct_answer) {
        html += `<div class="sol-box">Đáp án: <strong>${ex.correct_answer}</strong>`
        if (ex.solution) html += `<br>${renderText(ex.solution)}`
        html += `</div>`
      }
      html += `</div>`
    })
  }

  // Summary
  if (plan.summary) {
    html += `<div class="lp-summary"><h2 style="margin-top:0;border-bottom:none">📌 Tổng kết</h2>${renderText(plan.summary)}</div>`
  }
  if (plan.memory_tips) {
    html += `<div class="lp-tips"><strong>🧠 Mẹo nhớ:</strong> ${renderText(plan.memory_tips)}</div>`
  }

  html += `</div>`
  return html
}
