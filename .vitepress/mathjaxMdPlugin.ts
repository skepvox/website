import type MarkdownIt from 'markdown-it'
import MathJax from '@mathjax/src'

type MathJaxInstance = {
  tex2chtml: (value: string, options: { display: boolean }) => unknown
  chtmlStylesheet?: () => unknown
  handleRetriesFor?: <T>(fn: () => T) => Promise<T>
  startup: {
    adaptor: {
      outerHTML: (node: unknown) => string
      textContent: (node: unknown) => string
    }
    document?: {
      clear?: () => void
    }
  }
}

const MATHJAX_CHTML_FONT_URL =
  'https://cdn.jsdelivr.net/npm/@mathjax/mathjax-newcm-font@4.1.0/chtml/woff2'

const EXTRA_TEX_PACKAGES = [
  'action',
  'amscd',
  'bbm',
  'bboldx',
  'bbox',
  'begingroup',
  'boldsymbol',
  'braket',
  'bussproofs',
  'cancel',
  'cases',
  'centernot',
  'color',
  'colortbl',
  'colorv2',
  'dsfont',
  'empheq',
  'enclose',
  'extpfeil',
  'gensymb',
  'html',
  'mathtools',
  'mhchem',
  'noerrors',
  'physics',
  'setoptions',
  'tagformat',
  'texhtml',
  'textcomp',
  'unicode',
  'units',
  'upgreek',
  'verb'
]

export async function initMathJax(): Promise<MathJaxInstance> {
  const mathjax = await MathJax.init({
    loader: {
      load: [
        'input/tex',
        'output/chtml',
        'a11y/assistive-mml',
        ...EXTRA_TEX_PACKAGES.map((pkg) => `[tex]/${pkg}`)
      ]
    },
    tex: {
      packages: {
        '[+]': EXTRA_TEX_PACKAGES
      }
    },
    startup: {
      typeset: false,
      loadAllFontFiles: true
    },
    chtml: {
      mtextInheritFont: false,
      merrorInheritFont: true,
      adaptiveCSS: false,
      linebreaks: {
        inline: false
      }
    }
  })

  if (!mathjax) {
    throw new Error(
      'MathJax init failed. Check font extension packages for bbm, bboldx, dsfont, and mhchem.'
    )
  }

  return mathjax as MathJaxInstance
}

export async function getMathJaxStyles(mathjax: MathJaxInstance) {
  const id = 'MJX-CHTML-styles'
  const stylesheet = mathjax.chtmlStylesheet

  if (!stylesheet) {
    return { id, css: '' }
  }

  const sheet = mathjax.handleRetriesFor
    ? await mathjax.handleRetriesFor(() => stylesheet())
    : stylesheet()

  if (!sheet) {
    return { id, css: '' }
  }

  const css = mathjax.startup.adaptor.textContent(sheet)
  const normalizedCss = css.replace(
    /@mathjax\/mathjax-[^/]+-font(?:@[^/]+)?\/(?:js\/)?chtml\/woff2/g,
    MATHJAX_CHTML_FONT_URL.replace(/\/$/, '')
  )

  return {
    id,
    css: normalizedCss
  }
}

// Test if potential opening or closing delimiter.
// Assumes that there is a "$" at state.src[pos].
function isValidDelim(state: any, pos: number) {
  let max = state.posMax
  let canOpen = true
  let canClose = true
  const prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1
  const nextChar = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1

  // Check non-whitespace conditions for opening and closing, and
  // check that closing delimiter isn't followed by a number.
  if (
    prevChar === 0x20 ||
    prevChar === 0x09 ||
    (nextChar >= 0x30 && nextChar <= 0x39)
  ) {
    canClose = false
  }
  if (nextChar === 0x20 || nextChar === 0x09) {
    canOpen = false
  }

  return {
    can_open: canOpen,
    can_close: canClose
  }
}

function mathInline(state: any, silent: boolean) {
  if (state.src[state.pos] !== '$') {
    return false
  }

  let res = isValidDelim(state, state.pos)
  if (!res.can_open) {
    if (!silent) {
      state.pending += '$'
    }
    state.pos += 1
    return true
  }

  const start = state.pos + 1
  let match = start
  while ((match = state.src.indexOf('$', match)) !== -1) {
    let pos = match - 1
    while (state.src[pos] === '\\') {
      pos -= 1
    }
    if ((match - pos) % 2 === 1) {
      break
    }
    match += 1
  }

  if (match === -1) {
    if (!silent) {
      state.pending += '$'
    }
    state.pos = start
    return true
  }

  if (match - start === 0) {
    if (!silent) {
      state.pending += '$$'
    }
    state.pos = start + 1
    return true
  }

  res = isValidDelim(state, match)
  if (!res.can_close) {
    if (!silent) {
      state.pending += '$'
    }
    state.pos = start
    return true
  }

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '$'
    token.content = state.src.slice(start, match)
  }
  state.pos = match + 1
  return true
}

function mathBlock(state: any, start: number, end: number, silent: boolean) {
  let next
  let lastPos
  let found = false
  let pos = state.bMarks[start] + state.tShift[start]
  let max = state.eMarks[start]
  let lastLine = ''

  if (pos + 2 > max) {
    return false
  }

  if (state.src.slice(pos, pos + 2) !== '$$') {
    return false
  }

  pos += 2
  let firstLine = state.src.slice(pos, max)

  if (silent) {
    return true
  }

  if (firstLine.trim().slice(-2) === '$$') {
    firstLine = firstLine.trim().slice(0, -2)
    found = true
  }

  for (next = start; !found; ) {
    next++
    if (next >= end) {
      break
    }

    pos = state.bMarks[next] + state.tShift[next]
    max = state.eMarks[next]

    if (pos < max && state.tShift[next] < state.blkIndent) {
      break
    }

    if (state.src.slice(pos, max).trim().slice(-2) === '$$') {
      lastPos = state.src.slice(0, max).lastIndexOf('$$')
      lastLine = state.src.slice(pos, lastPos)
      found = true
    }
  }

  state.line = next + 1

  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.content =
    (firstLine && firstLine.trim() ? `${firstLine}\n` : '') +
    state.getLines(start + 1, next, state.tShift[start], true) +
    (lastLine && lastLine.trim() ? lastLine : '')
  token.map = [start, state.line]
  token.markup = '$$'

  return true
}

export function createMathJaxMdPlugin(mathjax: MathJaxInstance) {
  function renderMath(content: string, display: boolean) {
    const node = mathjax.tex2chtml(content, { display })
    const html = mathjax.startup.adaptor.outerHTML(node)
    return html
  }

  return (md: MarkdownIt) => {
    md.inline.ruler.after('escape', 'math_inline', mathInline)
    md.block.ruler.after('blockquote', 'math_block', mathBlock, {
      alt: ['paragraph', 'reference', 'blockquote', 'list']
    })

    md.renderer.rules.math_inline = (tokens, idx) =>
      renderMath(tokens[idx].content, false)
    md.renderer.rules.math_block = (tokens, idx) =>
      renderMath(tokens[idx].content, true)
  }
}
