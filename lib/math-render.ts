import katex from 'katex'

function repairLatexCommands(math: string): string {
  // Reduce 2+ backslashes only when followed by a letter (command name).
  // This fixes OCR artifacts like \\frac → \frac while preserving \\ (LaTeX line breaks).
  let result = math.replace(/\\{2,}(?=[A-Za-z])/g, '\\')

  return result
    // OCR/data sometimes writes Vietnamese "vectơ/vecto" as if it were a LaTeX command.
    .replace(/\\?vect[ơo]\s*\{?([a-z])\}?/giu, '\\vec{$1}')
    .replace(/\\?vect[ơo]\s*\{?([A-Z][A-Z0-9']*)\}?/gu, '\\overrightarrow{$1}')
    .replace(/\\?overline\s*\{\s*([A-Z][A-Z0-9']*)\s*\}/g, '\\overrightarrow{$1}')
    .replace(/\\?overrightarrow\s*\{\s*([a-z])\s*\}/g, '\\vec{$1}')
    .replace(/\\?overrightarrow\s*\{\s*([A-Z][A-Z0-9']*)\s*\}/g, '\\overrightarrow{$1}')
    .replace(/\\?vec\s*\{\s*([a-z])\s*\}/g, '\\vec{$1}')
    .replace(/\\?vec\s+([a-z])(?![A-Za-zÀ-ỹ])/g, '\\vec{$1}')
    .replace(/\\?vec\s*\{\s*([A-Z][A-Z0-9']*)\s*\}/g, '\\overrightarrow{$1}')
    .replace(/\\?sqrt\s*\{\s*([^{}]+?)\s*\}/g, '\\sqrt{$1}')
    .replace(/\\?sqrt\s+([A-Za-z0-9]+)/g, '\\sqrt{$1}')
    .replace(/\\?sqrt([0-9]+)/g, '\\sqrt{$1}')
    .replace(/\\?dfrac\s*\{\s*([^{}]+?)\s*\}\s*\{\s*([^{}]+?)\s*\}/g, '\\dfrac{$1}{$2}')
    .replace(/(?<!d)\\?frac\s*\{\s*([^{}]+?)\s*\}\s*\{\s*([^{}]+?)\s*\}/g, '\\frac{$1}{$2}')
    .replace(/(^|[^\\A-Za-z])dfrac(?=\s*\{)/g, '$1\\dfrac')
    .replace(/(^|[^\\A-Za-z])frac(?=\s*\{)/g, '$1\\frac')
    .replace(/(^|[^\\A-Za-z])begin(?=\s*\{)/g, '$1\\begin')
    .replace(/(^|[^\\A-Za-z])end(?=\s*\{)/g, '$1\\end')
    .replace(/(^|[^\\A-Za-z])mathbb(?=\s*\{)/g, '$1\\mathbb')
    .replace(/(^|[^\\A-Za-z])text(?=\s*\{)/g, '$1\\text')
    .replace(/(^|[^\\A-Za-z])left(?=\s*[({[|])/g, '$1\\left')
    .replace(/(^|[^\\A-Za-z])right(?=\s*[)}\]|])/g, '$1\\right')
    .replace(/(^|[^\\A-Za-z])(sin|cos|tan|cot|log|ln|lim|sum|int|cdot|times|leq|geq|neq|infty|pi|alpha|beta|gamma|Delta|theta|varphi)(?![A-Za-zÀ-ỹ])/g, '$1\\$2')
}

function protectDelimitedMath(text: string) {
  const tokens: string[] = []
  const protectedText = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (match) => {
      const key = `@@MATH_${tokens.length}@@`
      tokens.push(match)
      return key
    })
    .replace(/\\\(([\s\S]*?)\\\)/g, (match) => {
      const key = `@@MATH_${tokens.length}@@`
      tokens.push(match)
      return key
    })
    .replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
      const key = `@@MATH_${tokens.length}@@`
      tokens.push(match)
      return key
    })
    .replace(/\$([^$\n]+?)\$/g, (match) => {
      const key = `@@MATH_${tokens.length}@@`
      tokens.push(match)
      return key
    })
  return { protectedText, tokens }
}

function restoreDelimitedMath(text: string, tokens: string[]) {
  return text.replace(/@@MATH_(\d+)@@/g, (_, index) => tokens[Number(index)] ?? '')
}

function autoWrapLooseMath(text: string): string {
  const { protectedText, tokens } = protectDelimitedMath(text)
  const brace = String.raw`(?:[^{}]|\{[^{}]*\})+`
  const commandPattern = String.raw`(?:\\?(?:dfrac\s*\{${brace}\}\s*\{${brace}\}|frac\s*\{${brace}\}\s*\{${brace}\}|sqrt\s*(?:\{${brace}\}|[A-Za-z0-9]+)|vec(?:\s*\{${brace}\}|\s+[a-z](?![A-Za-zÀ-ỹ])|\{${brace}\})|overrightarrow\s*\{${brace}\}|overline\s*\{${brace}\}))`
  const equationPattern = new RegExp(String.raw`((?:[A-Z][A-Z0-9']*\s*=\s*)+${commandPattern}(?:\s*,\s*(?:[A-Z][A-Z0-9']*\s*=\s*)+${commandPattern})*)`, 'g')
  const commandOnlyPattern = new RegExp(String.raw`(^|[\s([,;:=])(${commandPattern})`, 'g')

  const wrapped = protectedText
    .replace(equationPattern, (match) => `$${repairLatexCommands(match)}$`)
    .replace(commandOnlyPattern, (match, prefix, math) => `${prefix}$${repairLatexCommands(math)}$`)

  return restoreDelimitedMath(wrapped, tokens)
}

export function normalizeMathText(text: string): string {
  if (!text) return ''
  return text
    .replace(/\*\*/g, '')
    .replace(/__+/g, '')
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\\[${repairLatexCommands(math)}\\]`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `\\(${repairLatexCommands(math)}\\)`)
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => `$$${repairLatexCommands(math)}$$`)
    .replace(/\$([^$\n]+?)\$/g, (_, math) => `$${repairLatexCommands(math)}$`)
}

function renderMath(math: string, displayMode = false) {
  return katex.renderToString(repairLatexCommands(math.trim()), { throwOnError: false, displayMode })
}

export function renderLatex(text: string, displayClass = 'my-2 overflow-x-auto py-1'): string {
  if (!text) return ''
  let result = autoWrapLooseMath(normalizeMathText(text))
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try { return `<div class="${displayClass}">${renderMath(math, true)}</div>` } catch { return math }
  })
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try { return renderMath(math, false) } catch { return math }
  })
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try { return `<div class="${displayClass}">${renderMath(math, true)}</div>` } catch { return math }
  })
  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try { return renderMath(math, false) } catch { return math }
  })
  return result.replace(/\n/g, '<br/>')
}
