import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const DEMOS_ENTITY_DIRS = [
  {
    type: 'person',
    idPrefix: 'person--',
    dir: path.join(ROOT, 'src', 'demos', 'pessoas'),
    urlBase: '/demos/pessoas/'
  },
  {
    type: 'org',
    idPrefix: 'org--',
    dir: path.join(ROOT, 'src', 'demos', 'organizacoes'),
    urlBase: '/demos/organizacoes/'
  },
  {
    type: 'case',
    idPrefix: 'case--',
    dir: path.join(ROOT, 'src', 'demos', 'casos'),
    urlBase: '/demos/casos/'
  }
]

const OUT_DIR = path.join(ROOT, 'src', 'public', 'demos-data')
const OUT_NOTES_DIR = path.join(OUT_DIR, 'notes')
const OUT_NOTES_META_DIR = path.join(OUT_DIR, 'notes-meta')
const OUT_SUBGRAPHS_DIR = path.join(OUT_DIR, 'subgraphs')
const OUT_JSONL = path.join(OUT_DIR, 'notes.jsonl')
const OUT_GRAPH = path.join(OUT_DIR, 'graph.json')
const OUT_QUESTIONS = path.join(OUT_DIR, 'questions.json')

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

async function pathExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function writeFileIfChanged(targetPath, nextContent) {
  const exists = await pathExists(targetPath)
  if (exists) {
    const current = await fs.readFile(targetPath, 'utf-8').catch(() => null)
    if (current === nextContent) {
      return { changed: false }
    }
  } else {
    await fs.mkdir(path.dirname(targetPath), { recursive: true })
  }

  await fs.writeFile(targetPath, nextContent, 'utf-8')
  return { changed: true }
}

function parseFrontmatter(rawMarkdown) {
  const match = rawMarkdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  if (!match) {
    return {
      ok: false,
      error: 'missing_frontmatter'
    }
  }

  const frontmatterYaml = match[1]
  const bodyMarkdown = match[2]
  let frontmatter = null
  try {
    frontmatter = parseYaml(frontmatterYaml) ?? {}
  } catch (error) {
    return {
      ok: false,
      error: 'invalid_frontmatter_yaml',
      details: error?.message ?? String(error)
    }
  }

  return {
    ok: true,
    frontmatterYaml,
    frontmatter,
    bodyMarkdown
  }
}

function normalizeInternalHref(href) {
  if (typeof href !== 'string') {
    return null
  }
  if (!href.startsWith('/demos/')) {
    return null
  }
  return href.split('#')[0].split('?')[0]
}

function extractUpdatedAt(bodyMarkdown) {
  const match = bodyMarkdown.match(/_Última atualização:\s*(\d{4}-\d{2}-\d{2})\./)
  return match?.[1] ?? null
}

function extractInternalLinks(bodyMarkdown) {
  const links = []
  const regex = /\[([^\]]+)\]\((\/demos\/[^)\s]+)\)/g
  for (const match of bodyMarkdown.matchAll(regex)) {
    const text = match[1]?.trim() ?? ''
    const href = normalizeInternalHref(match[2])
    if (!href) continue
    links.push({ text, href })
  }
  return links
}

function extractIntroMarkdown(bodyMarkdown) {
  const idx = bodyMarkdown.search(/^##\s+/m)
  if (idx === -1) return bodyMarkdown
  return bodyMarkdown.slice(0, idx)
}

function splitLevel2Sections(bodyMarkdown) {
  const sections = new Map()
  let current = null
  let buffer = []

  const flush = () => {
    if (!current) return
    sections.set(current, buffer.join('\n').trimEnd())
  }

  const lines = bodyMarkdown.split('\n')
  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/)
    if (match) {
      flush()
      current = match[1]
      buffer = []
      continue
    }
    if (current) buffer.push(line)
  }

  flush()
  return sections
}

function splitLevel2SectionsWithIntro(bodyMarkdown) {
  const sections = splitLevel2Sections(bodyMarkdown)
  const intro = extractIntroMarkdown(bodyMarkdown)

  const merged = new Map()
  if (intro.trim()) {
    merged.set('Intro', intro.trimEnd())
  }
  for (const [title, content] of sections.entries()) {
    merged.set(title, content)
  }
  return merged
}

function extractSectionInternalLinks(sectionMarkdown) {
  if (!sectionMarkdown) return []
  const links = []
  const regex = /^\s*-\s+\[([^\]]+)\]\((\/demos\/[^)\s]+)\)/gm
  for (const match of sectionMarkdown.matchAll(regex)) {
    const text = match[1]?.trim() ?? ''
    const href = normalizeInternalHref(match[2])
    if (!href) continue
    links.push({ text, href })
  }
  return links
}

function escapeRegexLiteral(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseOpenQuestions(sectionMarkdown, { noteId } = {}) {
  if (!sectionMarkdown) return []

  const noteIdEscaped = typeof noteId === 'string' && noteId.length > 0 ? escapeRegexLiteral(noteId) : null
  const questionIdRegex = noteIdEscaped
    ? new RegExp(`^\\-\\s+\\\`(q--${noteIdEscaped}--\\d{3})\\\`\\s*$`)
    : /^-\s+`(q--[^`]+--\d{3})`\s*$/

  const questions = []
  const lines = sectionMarkdown.split('\n')
  let current = null

  const pushCurrent = () => {
    if (!current) return
    questions.push(current)
    current = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    const idMatch = line.match(questionIdRegex)
    if (idMatch) {
      pushCurrent()
      current = {
        id: idMatch[1],
        question: null,
        state: null,
        hypothesis: null,
        counterHypothesis: null,
        nextSteps: null,
        advancingNotes: []
      }
      continue
    }

    if (!current) continue

    const questionMatch = line.match(/^-+\s*Pergunta:\s*(.+?)\s*$/)
    if (questionMatch) {
      current.question = questionMatch[1]
      continue
    }

    const stateMatch = line.match(/^-+\s*Estado:\s*`([^`]+)`\.?\s*$/)
    if (stateMatch) {
      current.state = stateMatch[1]
      continue
    }

    const hypothesisMatch = line.match(/^-+\s*Hipótese:\s*(.+?)\s*$/)
    if (hypothesisMatch) {
      current.hypothesis = hypothesisMatch[1]
      continue
    }

    const counterMatch = line.match(/^-+\s*Contra[-\u2011]hipótese:\s*(.+?)\s*$/)
    if (counterMatch) {
      current.counterHypothesis = counterMatch[1]
      continue
    }

    const nextStepsMatch = line.match(/^-+\s*Próximos passos:\s*(.+?)\s*$/)
    if (nextStepsMatch) {
      current.nextSteps = nextStepsMatch[1]
      continue
    }

    const advancingMatch = line.match(/^-+\s*Notas que avançam:\s*(.+?)\s*$/)
    if (advancingMatch) {
      const text = advancingMatch[1]
      current.advancingNotes = extractInternalLinks(text).map((item) => item.href)
      continue
    }
  }

  pushCurrent()
  return questions
}

function ensureDemosFrontmatter(frontmatter) {
  const demos = frontmatter?.demos
  if (!demos || typeof demos !== 'object') {
    return { ok: false, error: 'missing_demos_frontmatter' }
  }
  if (typeof demos.id !== 'string' || demos.id.length === 0) {
    return { ok: false, error: 'missing_demos_id' }
  }
  if (typeof demos.type !== 'string' || demos.type.length === 0) {
    return { ok: false, error: 'missing_demos_type' }
  }
  return { ok: true, demos }
}

function inferEntityUrl(entity, filePath) {
  const basename = path.basename(filePath, '.md')
  if (entity.type === 'person') return `${entity.urlBase}${basename}`
  if (entity.type === 'org') return `${entity.urlBase}${basename}`
  if (entity.type === 'case') return `${entity.urlBase}${basename}`
  return null
}

function slugFromId(id) {
  const parts = id.split('--')
  if (parts.length < 2) return null
  return parts.slice(1).join('--')
}

function getMarkdownPathForEntity(demos) {
  const slug = slugFromId(demos.id)
  if (!slug) return null

  if (demos.type === 'person') {
    return path.join(ROOT, 'src', 'demos', 'pessoas', `${slug}.md`)
  }
  if (demos.type === 'org') {
    return path.join(ROOT, 'src', 'demos', 'organizacoes', `${slug}.md`)
  }
  if (demos.type === 'case') {
    return path.join(ROOT, 'src', 'demos', 'casos', `${slug}.md`)
  }
  return null
}

async function collectEntityMarkdownFiles() {
  const results = []
  for (const entry of DEMOS_ENTITY_DIRS) {
    const files = await fs.readdir(entry.dir, { withFileTypes: true })
    for (const file of files) {
      if (!file.isFile()) continue
      if (!file.name.endsWith('.md')) continue
      if (file.name === 'index.md') continue
      results.push({
        entity: entry,
        filePath: path.join(entry.dir, file.name)
      })
    }
  }
  return results
}

function buildUrlToIdIndex(notes) {
  const map = new Map()
  for (const note of notes) {
    if (!note.url || !note.demos?.id) continue
    map.set(note.url, note.demos.id)
  }
  return map
}

function isYamlYes(value) {
  if (value === true) return true
  if (typeof value !== 'string') return false
  return value.toLowerCase() === 'yes'
}

function buildGraph({ notes, urlToId }) {
  const allowedDirectPersonEdgeKinds = new Set(['family'])

  const isPersonId = (id) => typeof id === 'string' && id.startsWith('person--')

  const nodes = notes
    .map((note) => ({
      id: note.demos.id,
      type: note.demos.type,
      url: note.url,
      dataUrl: `/demos-data/notes-meta/${note.demos.id}.json`,
      title: note.title ?? null,
      description: note.description ?? null,
      mapLabel: typeof note.demos.mapLabel === 'string' ? note.demos.mapLabel : null,
      seed: isYamlYes(note.demos.seed),
      seedId: typeof note.demos['seed-id'] === 'string' ? note.demos['seed-id'] : null,
      tags: Array.isArray(note.demos.tags) ? note.demos.tags : [],
      primaryRoles: Array.isArray(note.demos.primaryRoles) ? note.demos.primaryRoles : []
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

  const edgeMap = new Map()

  for (const note of notes) {
    const source = note.demos.id

    const ensureEdge = ({ target, kind }) => {
      const key = `${source}::${target}::${kind}`
      const current = edgeMap.get(key) ?? { source, target, kind, count: 0, sections: {} }
      edgeMap.set(key, current)
      return current
    }

    const addEdge = ({ href, kind, sectionTitle }) => {
      const targetUrl = normalizeInternalHref(href)
      const target = targetUrl ? urlToId.get(targetUrl) : null
      if (!target || target === source) return

      const isPersonToPerson = isPersonId(source) && isPersonId(target)
      if (isPersonToPerson && !allowedDirectPersonEdgeKinds.has(kind)) return
      if (kind === 'family' && !isPersonToPerson) return

      const current = ensureEdge({ target, kind })
      current.count += 1
      if (sectionTitle) {
        current.sections[sectionTitle] = (current.sections[sectionTitle] ?? 0) + 1
      }
    }

    const relTitles = note.relationSectionTitles ?? {}

    for (const rel of note.relations?.cases ?? []) {
      addEdge({
        href: rel.href,
        kind: 'related',
        sectionTitle: relTitles.cases ?? 'Casos relacionados'
      })
    }

    for (const rel of note.relations?.family ?? []) {
      addEdge({
        href: rel.href,
        kind: 'family',
        sectionTitle: relTitles.family ?? 'Relações familiares'
      })
    }

    for (const rel of note.relations?.people ?? []) {
      addEdge({
        href: rel.href,
        kind: 'related',
        sectionTitle: relTitles.people ?? 'Pessoas relacionadas'
      })
    }

    for (const rel of note.relations?.organizations ?? []) {
      addEdge({
        href: rel.href,
        kind: 'related',
        sectionTitle: relTitles.organizations ?? 'Organizações relacionadas'
      })
    }
  }

  const edges = Array.from(edgeMap.values()).sort((a, b) => {
    const bySource = a.source.localeCompare(b.source)
    if (bySource !== 0) return bySource
    const byTarget = a.target.localeCompare(b.target)
    if (byTarget !== 0) return byTarget
    return a.kind.localeCompare(b.kind)
  })

  return {
    schema: 'skepvox--demos-graph',
    schemaVersion: 3,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges
  }
}

function buildQuestionsIndex({ notes }) {
  const noteByUrl = new Map()
  for (const note of notes) {
    if (!note?.url) continue
    noteByUrl.set(note.url, note)
  }

  const issues = {
    missingBacklinks: [],
    inconsistentStates: [],
    orphanQuestions: [],
    missingTargetQuestions: []
  }

  const questions = []
  const questionById = new Map()

  for (const note of notes) {
    for (const q of note.openQuestions ?? []) {
      const question = {
        id: q.id,
        state: q.state ?? null,
        question: q.question ?? null,
        hypothesis: q.hypothesis ?? null,
        counterHypothesis: q.counterHypothesis ?? null,
        nextSteps: q.nextSteps ?? null,
        container: {
          id: note.demos.id,
          type: note.demos.type,
          url: note.url,
          title: note.title ?? null
        },
        advancingNotes: (q.advancingNotes ?? []).map((url) => {
          const target = noteByUrl.get(url) ?? null
          return {
            url,
            id: target?.demos?.id ?? null,
            type: target?.demos?.type ?? null,
            title: target?.title ?? null
          }
        }),
        targetedBy: []
      }

      questions.push(question)
      questionById.set(question.id, question)
    }
  }

  for (const note of notes) {
    const targets = Array.isArray(note.demos?.['target-questions'])
      ? note.demos['target-questions']
      : []
    for (const questionId of targets) {
      const question = questionById.get(questionId)
      if (!question) {
        issues.missingTargetQuestions.push({
          questionId,
          targetNoteId: note.demos.id
        })
        continue
      }
      question.targetedBy.push({
        id: note.demos.id,
        type: note.demos.type,
        url: note.url,
        title: note.title ?? null
      })
    }
  }

  const countsByState = {}

  for (const question of questions) {
    const state = question.state ?? 'missing'
    countsByState[state] = (countsByState[state] ?? 0) + 1

    question.targetedBy.sort((a, b) => a.id.localeCompare(b.id))
    question.advancingNotes.sort((a, b) => (a.id ?? a.url).localeCompare(b.id ?? b.url))

    const advancingUrls = new Set(question.advancingNotes.map((item) => item.url))

    for (const target of question.targetedBy) {
      if (!advancingUrls.has(target.url)) {
        issues.missingBacklinks.push({
          questionId: question.id,
          questionIn: question.container.id,
          targetNoteId: target.id
        })
      }
    }

    const hasWork = question.targetedBy.length > 0 || question.advancingNotes.length > 0

    if (!hasWork) {
      issues.orphanQuestions.push({
        questionId: question.id,
        questionIn: question.container.id
      })
    }

    if (question.state === 'aberta' && hasWork) {
      issues.inconsistentStates.push({
        questionId: question.id,
        questionIn: question.container.id,
        state: question.state,
        targetedByCount: question.targetedBy.length,
        advancingNotesCount: question.advancingNotes.length
      })
    }

    if (question.state === 'em-apuracao' && !hasWork) {
      issues.inconsistentStates.push({
        questionId: question.id,
        questionIn: question.container.id,
        state: question.state,
        targetedByCount: question.targetedBy.length,
        advancingNotesCount: question.advancingNotes.length
      })
    }
  }

  issues.missingBacklinks.sort((a, b) => a.questionId.localeCompare(b.questionId) || a.targetNoteId.localeCompare(b.targetNoteId))
  issues.inconsistentStates.sort((a, b) => a.questionId.localeCompare(b.questionId))
  issues.orphanQuestions.sort((a, b) => a.questionIn.localeCompare(b.questionIn) || a.questionId.localeCompare(b.questionId))
  issues.missingTargetQuestions.sort((a, b) => a.questionId.localeCompare(b.questionId) || a.targetNoteId.localeCompare(b.targetNoteId))

  const sourceSha256 = sha256(
    notes
      .map((note) => `${note.demos.id}:${note.source.sha256}`)
      .sort()
      .join('\n')
  )

  return {
    schema: 'skepvox--demos-questions',
    schemaVersion: 1,
    source: { sha256: sourceSha256 },
    questionCount: questions.length,
    countsByState,
    questions,
    issues
  }
}

function extractSubgraph(graph, focusId) {
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]))

  // Build adjacency map (bidirectional)
  const neighbors = new Map()
  for (const edge of graph.edges) {
    if (!neighbors.has(edge.source)) neighbors.set(edge.source, new Set())
    if (!neighbors.has(edge.target)) neighbors.set(edge.target, new Set())
    neighbors.get(edge.source).add(edge.target)
    neighbors.get(edge.target).add(edge.source)
  }

  // Find 1-hop neighbors
  const hop1 = neighbors.get(focusId) ?? new Set()

  // Find 2-hop neighbors (neighbors of 1-hop, excluding focus and 1-hop)
  const hop2 = new Set()
  for (const h1Id of hop1) {
    for (const h2Id of neighbors.get(h1Id) ?? []) {
      if (h2Id !== focusId && !hop1.has(h2Id)) {
        hop2.add(h2Id)
      }
    }
  }

  // Collect all node IDs in subgraph
  const subgraphNodeIds = new Set([focusId, ...hop1, ...hop2])

  // Filter nodes - keep ALL original fields from graph.json (same schema)
  const nodes = [...subgraphNodeIds]
    .map((id) => nodeById.get(id))
    .filter((n) => n != null)
    .sort((a, b) => a.id.localeCompare(b.id))

  // Filter edges - keep ALL original fields (same schema)
  const edges = graph.edges
    .filter((e) => subgraphNodeIds.has(e.source) && subgraphNodeIds.has(e.target))

  // Return same schema as graph.json, plus focusId for the component
  return {
    schema: 'skepvox--demos-graph',
    schemaVersion: 3,
    focusId,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges
  }
}

async function exportNotes() {
  const files = await collectEntityMarkdownFiles()

  const notes = []
  const notesMeta = []
  const errors = []

  for (const { entity, filePath } of files) {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = parseFrontmatter(raw)
    if (!parsed.ok) {
      errors.push({ filePath, error: parsed.error, details: parsed.details ?? null })
      continue
    }

    const { frontmatterYaml, frontmatter, bodyMarkdown } = parsed
    const demosCheck = ensureDemosFrontmatter(frontmatter)
    if (!demosCheck.ok) {
      errors.push({ filePath, error: demosCheck.error })
      continue
    }

    const demos = demosCheck.demos
    const url = inferEntityUrl(entity, filePath)
    const updatedAt = extractUpdatedAt(bodyMarkdown)

    const sections = splitLevel2Sections(bodyMarkdown)
    const sectionsWithIntro = splitLevel2SectionsWithIntro(bodyMarkdown)

    const relationSectionTitles = {
      cases: sections.has('Casos relacionados')
        ? 'Casos relacionados'
        : sections.has('Casos associados')
          ? 'Casos associados'
          : null,
      family: sections.has('Relações familiares')
        ? 'Relações familiares'
        : sections.has('Familia')
          ? 'Familia'
          : sections.has('Família')
            ? 'Família'
            : null,
      people: sections.has('Pessoas relacionadas') ? 'Pessoas relacionadas' : null,
      organizations: sections.has('Organizações relacionadas') ? 'Organizações relacionadas' : null
    }

    const relations = {
      cases: extractSectionInternalLinks(sections.get('Casos relacionados') ?? sections.get('Casos associados')),
      family: extractSectionInternalLinks(
        sections.get('Relações familiares') ??
          sections.get('Família') ??
          sections.get('Familia')
      ),
      people: extractSectionInternalLinks(sections.get('Pessoas relacionadas')),
      organizations: extractSectionInternalLinks(sections.get('Organizações relacionadas'))
    }

    const openQuestions = parseOpenQuestions(sections.get('Perguntas abertas (hipóteses)'), { noteId: demos.id })

    const outboundLinksBySection = []
    for (const [sectionTitle, sectionMarkdown] of sectionsWithIntro.entries()) {
      const links = extractInternalLinks(sectionMarkdown)
      if (!links.length) continue
      outboundLinksBySection.push({ section: sectionTitle, links })
    }

    const note = {
      schema: 'skepvox--demos-note',
      schemaVersion: 1,
      source: {
        path: path.relative(ROOT, filePath),
        sha256: sha256(raw)
      },
      id: demos.id,
      type: demos.type,
      url,
      title: typeof frontmatter.title === 'string' ? frontmatter.title : null,
      description: typeof frontmatter.description === 'string' ? frontmatter.description : null,
      updatedAt,
      demos,
      frontmatter,
      frontmatterYaml,
      bodyMarkdown,
      outboundLinks: extractInternalLinks(bodyMarkdown),
      outboundLinksBySection,
      relations,
      relationSectionTitles,
      openQuestions
    }

    notes.push(note)

    notesMeta.push({
      schema: 'skepvox--demos-note-meta',
      schemaVersion: 1,
      source: note.source,
      id: note.id,
      type: note.type,
      url: note.url,
      title: note.title,
      description: note.description,
      updatedAt: note.updatedAt,
      demos: note.demos,
      openQuestions: note.openQuestions
    })
  }

  notes.sort((a, b) => a.id.localeCompare(b.id))
  notesMeta.sort((a, b) => a.id.localeCompare(b.id))

  await fs.mkdir(OUT_NOTES_DIR, { recursive: true })
  await fs.mkdir(OUT_NOTES_META_DIR, { recursive: true })

  let changedCount = 0
  for (const note of notes) {
    const outPath = path.join(OUT_NOTES_DIR, `${note.id}.json`)
    const result = await writeFileIfChanged(outPath, `${JSON.stringify(note, null, 2)}\n`)
    if (result.changed) changedCount += 1
  }

  let metaCount = 0
  for (const noteMeta of notesMeta) {
    const outPath = path.join(OUT_NOTES_META_DIR, `${noteMeta.id}.json`)
    const result = await writeFileIfChanged(outPath, `${JSON.stringify(noteMeta, null, 2)}\n`)
    if (result.changed) changedCount += 1
    metaCount += 1
  }

  const jsonl = notes.map((note) => JSON.stringify(note)).join('\n') + '\n'
  const jsonlResult = await writeFileIfChanged(OUT_JSONL, jsonl)
  if (jsonlResult.changed) changedCount += 1

  const urlToId = buildUrlToIdIndex(notes)
  const graph = buildGraph({ notes, urlToId })
  const graphResult = await writeFileIfChanged(OUT_GRAPH, `${JSON.stringify(graph, null, 2)}\n`)
  if (graphResult.changed) changedCount += 1

  const questionsIndex = buildQuestionsIndex({ notes })
  const questionsResult = await writeFileIfChanged(OUT_QUESTIONS, `${JSON.stringify(questionsIndex, null, 2)}\n`)
  if (questionsResult.changed) changedCount += 1

  // Generate subgraphs for each entity
  await fs.mkdir(OUT_SUBGRAPHS_DIR, { recursive: true })
  let subgraphCount = 0
  for (const note of notes) {
    const subgraph = extractSubgraph(graph, note.demos.id)
    const outPath = path.join(OUT_SUBGRAPHS_DIR, `${note.demos.id}.json`)
    const result = await writeFileIfChanged(outPath, `${JSON.stringify(subgraph, null, 2)}\n`)
    if (result.changed) changedCount += 1
    subgraphCount += 1
  }

  return { notes, metaCount, errors, changedCount, subgraphCount, questionCount: questionsIndex.questionCount }
}

async function importNotes({ fromDir = OUT_NOTES_DIR } = {}) {
  const entries = await fs.readdir(fromDir, { withFileTypes: true })
  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(fromDir, entry.name))
    .sort()

  const results = { imported: 0, skipped: 0, errors: [] }

  for (const filePath of jsonFiles) {
    const raw = await fs.readFile(filePath, 'utf-8')
    let note = null
    try {
      note = JSON.parse(raw)
    } catch (error) {
      results.errors.push({
        filePath,
        error: 'invalid_json',
        details: error?.message ?? String(error)
      })
      continue
    }

    const demos = note?.frontmatter?.demos
    if (!demos || typeof demos !== 'object') {
      results.errors.push({ filePath, error: 'missing_frontmatter_demos' })
      continue
    }

    const outMarkdownPath = getMarkdownPathForEntity(demos)
    if (!outMarkdownPath) {
      results.errors.push({ filePath, error: 'cannot_infer_markdown_path' })
      continue
    }

    const frontmatterYaml = typeof note.frontmatterYaml === 'string' ? note.frontmatterYaml : null
    const bodyMarkdown = typeof note.bodyMarkdown === 'string' ? note.bodyMarkdown : null

    if (!frontmatterYaml || bodyMarkdown == null) {
      results.errors.push({ filePath, error: 'missing_frontmatterYaml_or_bodyMarkdown' })
      continue
    }

    const markdown = `---\n${frontmatterYaml.trim()}\n---\n${bodyMarkdown}`
    const writeResult = await writeFileIfChanged(outMarkdownPath, markdown)
    if (writeResult.changed) results.imported += 1
    else results.skipped += 1
  }

  return results
}

function usage() {
  return [
    'Usage:',
    '  node scripts/demos-notes-data.js export',
    '  node scripts/demos-notes-data.js import',
    '',
    'Outputs (export):',
    '  src/public/demos-data/notes/<demos.id>.json',
    '  src/public/demos-data/notes-meta/<demos.id>.json',
    '  src/public/demos-data/subgraphs/<demos.id>.json',
    '  src/public/demos-data/notes.jsonl',
    '  src/public/demos-data/graph.json',
    '  src/public/demos-data/questions.json',
    ''
  ].join('\n')
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] ?? 'export'

  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage())
    process.exit(0)
  }

  if (command === 'export') {
    const result = await exportNotes()
    if (result.errors.length) {
      console.error('Some notes failed to export:')
      for (const error of result.errors) {
        console.error(`- ${error.filePath}: ${error.error}${error.details ? ` (${error.details})` : ''}`)
      }
      process.exitCode = 1
    }
    console.log(
      `Exported ${result.notes.length} notes, ${result.metaCount} note meta files, ${result.subgraphCount} subgraphs (${result.changedCount} files changed).`
    )
    return
  }

  if (command === 'import') {
    const result = await importNotes()
    if (result.errors.length) {
      console.error('Some notes failed to import:')
      for (const error of result.errors) {
        console.error(`- ${error.filePath}: ${error.error}${error.details ? ` (${error.details})` : ''}`)
      }
      process.exitCode = 1
    }
    console.log(
      `Imported ${result.imported} notes (${result.skipped} unchanged).`
    )
    return
  }

  console.error(`Unknown command: ${command}\n\n${usage()}`)
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
