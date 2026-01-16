import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const readArg = (name) => {
  const prefix = `--${name}`
  const entry = args.find((arg) => arg === prefix || arg.startsWith(`${prefix}=`))
  if (!entry) {
    return null
  }
  if (entry.includes('=')) {
    return entry.split('=').slice(1).join('=')
  }
  const index = args.indexOf(entry)
  return index >= 0 ? args[index + 1] ?? null : null
}

const YEAR = Number(readArg('year') ?? 2025)
const AREA_CODE = readArg('area') ?? 'matematica'
const AREA_LABEL = readArg('label') ?? 'Matemática e suas Tecnologias'
const AREA_SHORT = readArg('short') ?? 'Matemática'
const SITE_URL = 'https://skepvox.com'

const QUESTIONS_DIR = path.join(ROOT, 'src', 'public', 'enem', String(YEAR), 'questions')
const OUTPUT_DIR = path.join(ROOT, 'src', 'enem', String(YEAR), AREA_CODE, 'questao')
const MAPPINGS_DIR = path.join(ROOT, 'src', 'public', 'enem', String(YEAR), 'mappings')
const SOLUTIONS_DIR = path.join(ROOT, 'src', 'public', 'enem', String(YEAR), 'solutions')

const BOOKLET_ORDER_BY_DAY = {
  1: ['CD1', 'CD2', 'CD3', 'CD4'],
  2: ['CD8', 'CD5', 'CD7', 'CD6']
}
const CANONICAL_BOOKLET_BY_DAY = {
  1: 'CD4',
  2: 'CD8'
}

let bookletQuestionMapping = {}
let bookletColors = {}
let bookletAnswerMapping = {}
let solutionsById = {}

const pathExists = async (target) => {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const normalizeText = (value, options = {}) => {
  if (!value) {
    return ''
  }
  return String(value)
    .replace(/\r\n?/g, '\n')
    .replace(/^\s*\u2022\s+/gm, '- ')
    .trim()
}

const stripLatexDelimitersForMeta = (value) => {
  if (!value) {
    return ''
  }
  return String(value)
    .replace(/\\\[(.+?)\\\]/gs, (_, inner) => String(inner).replace(/\s+/g, ' ').trim())
    .replace(/\\\((.+?)\\\)/g, (_, inner) => String(inner).trim())
    .replace(/\$([^\s][\s\S]*?[^\s])\$/g, (_, inner) => String(inner).trim())
    .replace(/\s+/g, ' ')
    .trim()
}

const convertLatexDelimitersForMarkdown = (value) => {
  if (!value) {
    return ''
  }
  return String(value)
    .replace(/\\\[(.+?)\\\]/gs, (_, inner) => `$$${String(inner).replace(/\s+/g, ' ').trim()}$$`)
    .replace(/\\\((.+?)\\\)/g, (_, inner) => `$${String(inner).trim()}$`)
}

const collapseLines = (value) => {
  const lines = value.split('\n')
  const output = []
  let paragraph = ''

  const flushParagraph = () => {
    if (!paragraph) {
      return
    }
    output.push(paragraph)
    paragraph = ''
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      if (!output.length || output[output.length - 1] !== '') {
        output.push('')
      }
      continue
    }
    if (line.startsWith('- ')) {
      flushParagraph()
      output.push(line)
      continue
    }
    paragraph = paragraph ? `${paragraph} ${line}` : line
  }

  flushParagraph()
  return output.join('\n')
}

const escapeYaml = (value) =>
  String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ')
    .trim()

const padNumber = (value) => String(value).padStart(3, '0')

const getQuestionId = (question) => `${question.year}-${padNumber(question.number)}`

const buildCanonicalUrl = (questionId) =>
  `${SITE_URL}/enem/${YEAR}/${AREA_CODE}/questao/${questionId}.html`

const buildQuestionJsonUrl = (questionId) =>
  `${SITE_URL}/enem/${YEAR}/questions/${questionId}.json`

const extractSnippet = (question) => {
  const parts = []
  if (question.statement?.trim()) {
    parts.push(question.statement.trim())
  }
  if (question.prompt?.text?.trim() && question.prompt.text.trim() !== question.statement?.trim()) {
    parts.push(question.prompt.text.trim())
  }
  const normalized = collapseLines(parts.join(' '))
  return stripLatexDelimitersForMeta(normalized)
}

const truncateText = (value, maxLength) => {
  if (!value) {
    return ''
  }
  if (value.length <= maxLength) {
    return value
  }
  const slice = value.slice(0, maxLength)
  const lastSpace = slice.lastIndexOf(' ')
  const cutoff = lastSpace > maxLength * 0.6 ? lastSpace : maxLength
  return `${slice.slice(0, cutoff).replace(/[.,;:!?]+$/g, '')}\u2026`
}

const getBookletEntries = (question) => {
  const questionId = getQuestionId(question)
  const mapping = bookletQuestionMapping[questionId] || {}
  const order = BOOKLET_ORDER_BY_DAY[question.day] || Object.keys(mapping)
  return order
    .filter((code) => mapping[code])
    .map((code) => {
      const mappedId = mapping[code]
      const number = Number(mappedId?.split('-')[1])
      return {
        code,
        cdNumber: Number(code.replace('CD', '')),
        color: bookletColors[code] || '',
        number
      }
    })
    .filter((entry) => Number.isFinite(entry.number))
}

const buildBookletSummary = (entries) => {
  if (!entries.length) {
    return ''
  }
  const parts = entries.map((entry) => `${entry.color} ${entry.number}`)
  return `Cadernos: ${parts.join(', ')}.`
}

const getCanonicalAnswer = (question) => {
  const questionId = getQuestionId(question)
  const code = CANONICAL_BOOKLET_BY_DAY[question.day]
  if (!code) {
    return null
  }
  const mapping = bookletAnswerMapping[questionId]
  if (!mapping) {
    return null
  }
  return mapping[code] || null
}

const buildMetaDescription = (question, entries) => {
  const lead = `ENEM ${question.year} ${AREA_SHORT} — Questão ${question.number}.`
  const mappingText = buildBookletSummary(entries)
  const snippet = extractSnippet(question)
  const baseLength = lead.length + (mappingText ? mappingText.length + 1 : 0)
  const remaining = Math.max(0, 180 - baseLength - 1)
  const snippetText = truncateText(snippet, remaining)
  const parts = [lead, snippetText, mappingText].filter(Boolean)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

const buildJsonLd = (question, entries, canonicalUrl, questionJsonUrl, correctAnswer) => {
  const identifier = getQuestionId(question)
  const props = entries.map((entry) => ({
    '@type': 'PropertyValue',
    name: `Caderno ${entry.color} (CD${entry.cdNumber})`,
    value: `Questão ${entry.number}`
  }))
  const text = extractSnippet(question)
  const acceptedAnswer = correctAnswer
    ? {
        '@type': 'Answer',
        text: `Alternativa ${correctAnswer}`
      }
    : undefined
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'EducationalQuestion',
      name: `ENEM ${question.year} ${AREA_LABEL} — Questão ${question.number}`,
      identifier,
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      inLanguage: 'pt-BR',
      educationalLevel: 'Ensino Médio',
      learningResourceType: 'Questão de prova',
      about: [AREA_SHORT, 'ENEM'],
      text: text || undefined,
      isAccessibleForFree: true,
      acceptedAnswer,
      isPartOf: {
        '@type': 'LearningResource',
        name: `ENEM ${question.year} — ${AREA_LABEL}`,
        url: `${SITE_URL}/enem/${question.year}/${AREA_CODE}.html`
      },
      additionalProperty: props.length ? props : undefined,
      contentUrl: questionJsonUrl
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'ENEM',
          item: `${SITE_URL}/enem/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: `ENEM ${question.year} ${AREA_LABEL}`,
          item: `${SITE_URL}/enem/${question.year}/${AREA_CODE}.html`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `Questão ${question.number}`,
          item: canonicalUrl
        }
      ]
    }
  ]
}

const renderBookletMapping = (question, entries) => {
  if (!entries.length) {
    return []
  }
  const lines = []
  lines.push('## Mapeamento de cadernos e cores', '')
  if (question.day) {
    lines.push(`Dia ${question.day} · Aplicação regular.`, '')
  }
  for (const entry of entries) {
    lines.push(
      `- Caderno ${entry.color} (CD${entry.cdNumber} / caderno ${entry.cdNumber}): Questão ${entry.number}.`
    )
  }
  return lines
}

const formatSource = (source) => {
  if (!source) {
    return ''
  }
  if (typeof source === 'string') {
    return source.trim()
  }
  const parts = []
  if (source.author) {
    parts.push(source.author)
  }
  if (source.title) {
    parts.push(source.title)
  }
  if (source.publication) {
    parts.push(source.publication)
  }
  if (source.page) {
    parts.push(`p. ${source.page}`)
  }
  if (source.url) {
    parts.push(source.url)
  }
  let line = parts.filter(Boolean).join('. ')
  if (source.access_date) {
    line = line ? `${line} (acesso em ${source.access_date})` : `Acesso em ${source.access_date}`
  }
  return line
}

const appendText = (lines, text, options = {}) => {
  const normalized = convertLatexDelimitersForMarkdown(normalizeText(text))
  if (!normalized) {
    return
  }
  const content = options.preserveLineBreaks ? normalized : collapseLines(normalized)
  if (!content) {
    return
  }
  lines.push(...content.split('\n'))
}

const renderImageAsset = (asset, year) => {
  const src = `/enem/${year}/${asset.file}`
  const alt = (asset.alt || '').trim()
  return [`![${alt}](${src})`]
}

const normalizeTableCell = (value) =>
  String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\\\|')
    .trim()

const renderTableAsset = (asset) => {
  const headers = asset.headers || []
  const rows = asset.rows || []
  const columnCount = Math.max(
    headers.length,
    ...rows.map((row) => row.length || 0)
  )
  if (!columnCount) {
    return []
  }

  const padRow = (row, size) => {
    const padded = [...row]
    while (padded.length < size) {
      padded.push('')
    }
    return padded
  }

  const normalizedHeaders = padRow(headers, columnCount).map(normalizeTableCell)
  const lines = []
  lines.push(`| ${normalizedHeaders.join(' | ')} |`)
  lines.push(`| ${Array.from({ length: columnCount }, () => '---').join(' | ')} |`)
  for (const row of rows) {
    const cells = padRow(row, columnCount).map(normalizeTableCell)
    lines.push(`| ${cells.join(' | ')} |`)
  }
  return lines
}

const renderChartAsset = (asset, question, variant) => {
  const parts = []
  if (asset.id) {
    parts.push(`id: '${asset.id}'`)
  }
  if (asset.type) {
    parts.push(`type: '${asset.type}'`)
  }
  if (asset.data_file) {
    parts.push(`data_file: '${asset.data_file}'`)
  }
  if (asset.meta_file) {
    parts.push(`meta_file: '${asset.meta_file}'`)
  }
  const assetLiteral = `{ ${parts.join(', ')} }`
  const variantProp = variant ? ` variant="${variant}"` : ''
  return [
    `<AssetChart :asset="${assetLiteral}" :year="${question.year}" :question-number="${question.number}"${variantProp} />`
  ]
}

const collectAssetsByPosition = (assets, position) => {
  const filterByPosition = (items) =>
    (items || []).filter((asset) => (asset.position || 'context') === position)
  return {
    images: filterByPosition(assets?.images),
    tables: filterByPosition(assets?.tables),
    formulas: filterByPosition(assets?.formulas),
    charts: filterByPosition(assets?.charts)
  }
}

const collectAssetItems = (assets, position) => {
  const { images, tables, formulas, charts } = collectAssetsByPosition(assets, position)
  return [
    ...images.map((asset) => ({ kind: 'image', asset })),
    ...tables.map((asset) => ({ kind: 'table', asset })),
    ...formulas.map((asset) => ({ kind: 'formula', asset })),
    ...charts.map((asset) => ({ kind: 'chart', asset }))
  ]
}

const renderAssetItem = (item, question) => {
  if (item.kind === 'image') {
    return renderImageAsset(item.asset, question.year)
  }
  if (item.kind === 'table') {
    return renderTableAsset(item.asset)
  }
  if (item.kind === 'chart') {
    return renderChartAsset(item.asset, question)
  }
  if (item.kind === 'formula') {
    if (item.asset.latex) {
      return [item.asset.latex]
    }
    if (item.asset.text) {
      return [item.asset.text]
    }
  }
  return []
}

const renderAssets = (assets, position, question) => {
  const lines = []
  const { images, tables, formulas, charts } = collectAssetsByPosition(assets, position)

  for (const asset of images) {
    lines.push(...renderImageAsset(asset, question.year), '')
  }
  for (const asset of tables) {
    lines.push(...renderTableAsset(asset), '')
  }
  for (const asset of formulas) {
    if (asset.latex) {
      lines.push(asset.latex, '')
    } else if (asset.text) {
      lines.push(asset.text, '')
    }
  }
  for (const asset of charts) {
    lines.push(...renderChartAsset(asset, question), '')
  }

  if (lines.length && lines[lines.length - 1] === '') {
    lines.pop()
  }
  return lines
}

const appendBlock = (lines, block) => {
  if (!block || !block.length) {
    return
  }
  if (lines.length && lines[lines.length - 1] !== '') {
    lines.push('')
  }
  lines.push(...block)
}

const buildFlowBlocks = (question, scope, options = {}) => {
  const flowItems = (question.text_flow || [])
    .filter((item) => item.scope === scope)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  if (!flowItems.length) {
    return null
  }
  const assetItems = collectAssetItems(question.assets, scope)
  const anchorMap = new Map()

  for (const item of flowItems) {
    if (!item.anchor) {
      continue
    }
    const list = anchorMap.get(item.anchor) || []
    list.push(item.text)
    anchorMap.set(item.anchor, list)
  }

  const usedAnchors = new Set()
  const blocks = []

  const pushTextBlock = (text) => {
    const normalized = convertLatexDelimitersForMarkdown(normalizeText(text))
    if (!normalized) {
      return
    }
    const content = options.preserveLineBreaks ? normalized : collapseLines(normalized)
    if (!content) {
      return
    }
    blocks.push(content.split('\n'))
  }

  const pushAnchorText = (anchor) => {
    if (!anchorMap.has(anchor)) {
      return
    }
    const texts = anchorMap.get(anchor) || []
    for (const text of texts) {
      pushTextBlock(text)
    }
    usedAnchors.add(anchor)
  }

  if (!assetItems.length) {
    for (const item of flowItems) {
      pushTextBlock(item.text)
      if (item.anchor) {
        usedAnchors.add(item.anchor)
      }
    }
    return blocks
  }

  pushAnchorText(`before:assets:${scope}`)
  for (const item of assetItems) {
    const assetId = item.asset?.id
    if (assetId) {
      pushAnchorText(`before:asset:${assetId}`)
    }
    const assetBlock = renderAssetItem(item, question)
    if (assetBlock.length) {
      blocks.push(assetBlock)
    }
    if (assetId) {
      pushAnchorText(`after:asset:${assetId}`)
    }
  }
  pushAnchorText(`after:assets:${scope}`)

  for (const item of flowItems) {
    if (item.anchor && usedAnchors.has(item.anchor)) {
      continue
    }
    pushTextBlock(item.text)
    if (item.anchor) {
      usedAnchors.add(item.anchor)
    }
  }

  return blocks
}

const stripOptionPrefix = (value, letter) => {
  if (!value) {
    return ''
  }
  const normalized = String(value).trim()
  if (!normalized) {
    return ''
  }
  if (!letter) {
    return normalized
  }
  const escapedLetter = String(letter).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return normalized
    .replace(new RegExp(`^Alternativa\\s+${escapedLetter}\\s*[:.\\-–—]\\s*`, 'i'), '')
    .trim()
}

const getOptionLabel = (option) => {
  const text = option.text?.trim()
  if (text) {
    return text
  }
  if (option.image_alt?.trim()) {
    const stripped = stripOptionPrefix(option.image_alt, option.letter)
    return stripped || option.image_alt.trim()
  }
  if (option.chart) {
    return `Alternativa ${option.letter} (gr\u00e1fico)`
  }
  return `Alternativa ${option.letter}`
}

const renderOptionImage = (option, question) => {
  if (!option.image) {
    return []
  }
  const alt = (option.image_alt || '').trim()
  const src = `/enem/${question.year}/${option.image}`
  return [`![${alt}](${src})`]
}

const renderOptions = (question) => {
  const lines = []
  const options = question.options || []
  options.forEach((option, index) => {
    const label = getOptionLabel(option)
    lines.push(`- **${option.letter}.** ${label}`)
    if (option.image) {
      lines.push('')
      for (const line of renderOptionImage(option, question)) {
        lines.push(`  ${line}`)
      }
      if (index < options.length - 1) {
        lines.push('')
      }
    }
    if (option.chart) {
      lines.push('')
      const chartLines = renderChartAsset(option.chart, question, 'option')
      for (const line of chartLines) {
        lines.push(`  ${line}`)
      }
      if (index < options.length - 1) {
        lines.push('')
      }
    }
  })
  return lines
}

const renderSolutionSection = (solution) => {
  if (!solution) {
    return ['<!-- TODO: adicionar solução -->']
  }

  const lines = []
  const ttsText = typeof solution.tts_text === 'string' ? solution.tts_text.trim() : ''
  if (ttsText) {
    lines.push('### Solu\u00e7\u00e3o completa', '')
    lines.push(...ttsText.split('\n'))
  }

  const shortMd = typeof solution.short_md === 'string' ? solution.short_md.trim() : ''
  if (shortMd) {
    lines.push('', '### Solu\u00e7\u00e3o resumida', '', ...shortMd.split('\n'), '')
  }

  const steps = Array.isArray(solution.steps) ? solution.steps : []
  if (steps.length) {
    lines.push('### Solu\u00e7\u00e3o passo a passo', '')
    steps.forEach((step, index) => {
      const title = typeof step.title === 'string' ? step.title.trim() : ''
      const body = typeof step.body_md === 'string' ? step.body_md.trim() : ''
      if (title) {
        lines.push(`#### ${index + 1}. ${title}`, '')
      } else {
        lines.push(`#### ${index + 1}`, '')
      }
      if (body) {
        lines.push(...body.split('\n'))
      }
      lines.push('')
    })
    if (lines[lines.length - 1] === '') {
      lines.pop()
    }
  }

  return lines.length ? lines : ['<!-- TODO: adicionar solução -->']
}

const buildMarkdown = (question) => {
  const lines = []
  const questionId = getQuestionId(question)
  const canonicalUrl = buildCanonicalUrl(questionId)
  const questionJsonUrl = buildQuestionJsonUrl(questionId)
  const bookletEntries = getBookletEntries(question)
  const correctAnswer = getCanonicalAnswer(question)
  const solution = solutionsById[questionId]
  const description = buildMetaDescription(question, bookletEntries)
  const title = `ENEM ${question.year} ${AREA_LABEL} — Questão ${question.number}`
  const jsonLd = buildJsonLd(
    question,
    bookletEntries,
    canonicalUrl,
    questionJsonUrl,
    correctAnswer
  )
  lines.push('---')
  lines.push(`title: "${escapeYaml(title)}"`)
  lines.push(`description: "${escapeYaml(description)}"`)
  lines.push('sidebar: false')
  lines.push('outline: false')
  lines.push('aside: false')
  lines.push('footer: false')
  lines.push('pageClass: enem-question-page')
  lines.push('head:')
  lines.push('  - - link')
  lines.push('    - rel: canonical')
  lines.push(`      href: "${canonicalUrl}"`)
  lines.push('  - - link')
  lines.push('    - rel: alternate')
  lines.push('      type: application/json')
  lines.push(`      href: "${questionJsonUrl}"`)
  lines.push(`      title: "Dados da questão (JSON)"`)
  lines.push('  - - meta')
  lines.push('    - name: description')
  lines.push(`      content: "${escapeYaml(description)}"`)
  lines.push('  - - meta')
  lines.push('    - property: og:title')
  lines.push(`      content: "${escapeYaml(title)}"`)
  lines.push('  - - meta')
  lines.push('    - property: og:description')
  lines.push(`      content: "${escapeYaml(description)}"`)
  lines.push('  - - meta')
  lines.push('    - property: og:url')
  lines.push(`      content: "${canonicalUrl}"`)
  lines.push('  - - meta')
  lines.push('    - property: og:type')
  lines.push('      content: article')
  lines.push('  - - meta')
  lines.push('    - name: twitter:card')
  lines.push('      content: summary')
  lines.push('  - - meta')
  lines.push('    - name: twitter:title')
  lines.push(`      content: "${escapeYaml(title)}"`)
  lines.push('  - - meta')
  lines.push('    - name: twitter:description')
  lines.push(`      content: "${escapeYaml(description)}"`)
  for (const schema of jsonLd) {
    lines.push('  - - script')
    lines.push('    - type: application/ld+json')
    lines.push('    - |')
    const jsonLines = JSON.stringify(schema, null, 2).split('\n')
    for (const line of jsonLines) {
      lines.push(`      ${line}`)
    }
  }
  lines.push('---', '')
  lines.push(`# ENEM ${question.year} — ${AREA_LABEL} — Questão ${question.number}`, '')

  const mappingLines = renderBookletMapping(question, bookletEntries)
  if (mappingLines.length) {
    lines.push(...mappingLines, '')
  }
  lines.push(
    `[${AREA_SHORT} ${question.year} · Caderno Verde Completo](/enem/${question.year}/${AREA_CODE}.html)`,
    ''
  )

  if (question.context?.content) {
    lines.push('## Contexto', '')
    const preserveLineBreaks =
      question.context?.type === 'poem' ||
      question.context?.type === 'lyrics' ||
      question.context?.type === 'list'
    const contextBlocks = buildFlowBlocks(question, 'context', { preserveLineBreaks })
    if (contextBlocks?.length) {
      for (const block of contextBlocks) {
        appendBlock(lines, block)
      }
    } else {
      appendText(lines, question.context.content, { preserveLineBreaks })
      const assetLines = renderAssets(question.assets, 'context', question)
      if (assetLines.length) {
        appendBlock(lines, assetLines)
      }
    }
    const sourceLine = formatSource(question.context.source)
    if (sourceLine) {
      appendBlock(lines, [`Fonte: ${sourceLine}`])
    }
    lines.push('')
  }

  lines.push('## Enunciado', '')
  const statement = question.statement?.trim() || ''
  const prompt = question.prompt?.text?.trim() || ''
  if (statement) {
    appendText(lines, statement)
  }
  if (prompt && prompt !== statement) {
    if (lines[lines.length - 1] !== '') {
      lines.push('')
    }
    appendText(lines, prompt)
  }
  if (!statement && !prompt) {
    lines.push('_Enunciado em constru\u00e7\u00e3o._')
  }

  const statementAssets = renderAssets(question.assets, 'statement', question)
  if (statementAssets.length) {
    lines.push('', ...statementAssets)
  }
  lines.push('')

  lines.push('## Alternativas', '')
  lines.push(...renderOptions(question))
  const optionAssets = renderAssets(question.assets, 'options', question)
  if (optionAssets.length) {
    lines.push('', ...optionAssets)
  }
  lines.push('', '## Resposta correta', '')
  if (question.metadata?.annulled || question.correct_answer === null) {
    lines.push('- Quest\u00e3o anulada.')
  } else if (correctAnswer) {
    const option = (question.options || []).find(
      (item) => item.letter === correctAnswer
    )
    const label = option ? getOptionLabel(option) : `Alternativa ${correctAnswer}`
    lines.push(`- **${correctAnswer}.** ${label}`)
    if (option?.image) {
      lines.push('', `  ${renderOptionImage(option, question)[0]}`)
    }
  } else {
    lines.push('_Resposta em revisão._')
  }
  lines.push('', '## Solu\u00e7\u00e3o', '')
  lines.push(...renderSolutionSection(solution))
  lines.push('')

  return lines.join('\n')
}

const loadSolutions = async () => {
  if (!(await pathExists(SOLUTIONS_DIR))) {
    solutionsById = {}
    return
  }
  const entries = await fs.readdir(SOLUTIONS_DIR)
  const solutions = {}
  for (const entry of entries) {
    if (!/^\d{4}-\d{3}\.json$/i.test(entry)) {
      continue
    }
    const content = await fs.readFile(path.join(SOLUTIONS_DIR, entry), 'utf-8')
    const data = JSON.parse(content)
    const key = entry.replace(/\.json$/i, '')
    solutions[key] = data
  }
  solutionsById = solutions
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  try {
    bookletQuestionMapping = JSON.parse(
      await fs.readFile(path.join(MAPPINGS_DIR, 'booklet-question-mapping.json'), 'utf-8')
    )
    bookletColors = JSON.parse(
      await fs.readFile(path.join(MAPPINGS_DIR, 'booklet-colors.json'), 'utf-8')
    )
    bookletAnswerMapping = JSON.parse(
      await fs.readFile(path.join(MAPPINGS_DIR, 'booklet-answer-mapping.json'), 'utf-8')
    )
  } catch (error) {
    console.warn('Booklet mappings not loaded:', error?.message || error)
  }
  await loadSolutions()
  const entries = await fs.readdir(QUESTIONS_DIR)
  const questions = []

  for (const entry of entries) {
    if (!/^\d{4}-\d{3}\.json$/i.test(entry)) {
      continue
    }
    const content = await fs.readFile(path.join(QUESTIONS_DIR, entry), 'utf-8')
    const question = JSON.parse(content)
    if (question.year !== YEAR || question.day !== 2) {
      continue
    }
    if (question.area?.code !== AREA_CODE) {
      continue
    }
    questions.push(question)
  }

  questions.sort((a, b) => a.number - b.number)

  for (const question of questions) {
    const slug = `${YEAR}-${padNumber(question.number)}`
    const outputPath = path.join(OUTPUT_DIR, `${slug}.md`)
    const markdown = buildMarkdown(question)
    await fs.writeFile(outputPath, `${markdown}\n`, 'utf-8')

  }

  console.log(`Generated ${questions.length} question pages in ${path.relative(ROOT, OUTPUT_DIR)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
