import katex from 'katex'

const LATEX_COMMANDS = [
  'frac', 'sqrt', 'vec', 'overrightarrow', 'overleftarrow', 'overline', 'widehat', 'hat', 'bar',
  'sin', 'cos', 'tan', 'cot', 'log', 'ln', 'lim', 'sum', 'int', 'left', 'right', 'cdot', 'times',
  'leq', 'geq', 'neq', 'infty', 'pi', 'alpha', 'beta', 'gamma', 'Delta', 'theta', 'varphi',
]

function repairLatexCommands(math: string): string {
  let result = math.replace(/\\+/g, '\\')

  for (const command of LATEX_COMMANDS) {
    result = result.replace(
      new RegExp(`(^|[^\\\\A-Za-z])${command}(?=\\s*(?:\\{|[A-Za-z0-9\\\\]))`, 'g'),
      `$1\\${command}`,
    )
  }

  return result
    .replace(/\\overline\{([A-Z][A-Z0-9']*)\}/g, '\\overrightarrow{$1}')
    .replace(/\\overrightarrow\{([a-z])\}/g, '\\vec{$1}')
    .replace(/\\vec\{([A-Z][A-Z0-9']*)\}/g, '\\overrightarrow{$1}')
    .replace(/\\sqrt\s+([A-Za-z0-9]+)/g, '\\sqrt{$1}')
    .replace(/\\vec\s+([a-z])/g, '\\vec{$1}')
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
  const commandPattern = String.raw`(?:\\?(?:frac\s*\{[^{}]+\}\s*\{[^{}]+\}|sqrt\s*(?:\{[^{}]+\}|[A-Za-z0-9]+)|vec\s*(?:\{[^{}]+\}|[a-z])|overrightarrow\s*\{[^{}]+\}|overline\s*\{[^{}]+\}))`
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
