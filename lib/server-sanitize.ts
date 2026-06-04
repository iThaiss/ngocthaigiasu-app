import sanitizeHtml from 'sanitize-html'

const MATHML_TAGS = [
  'annotation',
  'math',
  'mfrac',
  'mi',
  'mn',
  'mo',
  'mrow',
  'msqrt',
  'mstyle',
  'msub',
  'msubsup',
  'msup',
  'mtable',
  'mtd',
  'mtext',
  'mtr',
  'semantics',
]

export function sanitizeLessonHtml(html: string | null | undefined): string | null {
  if (!html) return null

  return sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      ...MATHML_TAGS,
      'br',
      'div',
      'img',
      'span',
      'table',
      'tbody',
      'td',
      'tfoot',
      'th',
      'thead',
      'tr',
    ],
    allowedAttributes: {
      '*': ['aria-hidden', 'class', 'colspan', 'rowspan', 'title'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['alt', 'height', 'loading', 'src', 'width'],
      math: ['display', 'xmlns'],
      annotation: ['encoding'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['https'],
    },
    disallowedTagsMode: 'discard',
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
  })
}
