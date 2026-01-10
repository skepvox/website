import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const args = new Set(process.argv.slice(2))
const FIX_MODE = args.has('--fix')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const DEMOS_ENTITY_DIRS = [
  {
    type: 'person',
    dir: path.join(ROOT, 'src', 'demos', 'pessoas'),
    urlBase: '/demos/pessoas/'
  },
  {
    type: 'org',
    dir: path.join(ROOT, 'src', 'demos', 'organizacoes'),
    urlBase: '/demos/organizacoes/'
  }
]

const DEMOS_NOTE_DIRS_TO_SCAN = [
  path.join(ROOT, 'src', 'demos', 'pessoas'),
  path.join(ROOT, 'src', 'demos', 'organizacoes'),
  path.join(ROOT, 'src', 'demos', 'casos')
]

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeLabel(label) {
  return label
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
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
    return { ok: false, error: 'missing_frontmatter' }
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

  return { ok: true, frontmatterYaml, frontmatter, bodyMarkdown }
}

async function listMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(dir, entry.name))
}

function buildExcludedRanges(markdown) {
  const ranges = []

  const patterns = [
    /```[\s\S]*?```/g, // fenced code blocks
    /`[^`]*`/g, // inline code
    /https?:\/\/\S+/g, // bare URLs
    /!\[[^\]]*]\([^)\n]*\)/g, // images
    /\[[^\]]+]\([^)\n]*\)/g // links
  ]

  for (const pattern of patterns) {
    for (const match of markdown.matchAll(pattern)) {
      const start = match.index ?? 0
      const end = start + match[0].length
      ranges.push({ start, end })
    }
  }

  ranges.sort((a, b) => a.start - b.start || a.end - b.end)
  const merged = []
  for (const range of ranges) {
    const last = merged.at(-1)
    if (!last || range.start > last.end) {
      merged.push({ ...range })
      continue
    }
    if (range.end > last.end) {
      last.end = range.end
    }
  }
  return merged
}

function isExcluded(index, excludedRanges) {
  let lo = 0
  let hi = excludedRanges.length - 1
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const range = excludedRanges[mid]
    if (index < range.start) {
      hi = mid - 1
      continue
    }
    if (index >= range.end) {
      lo = mid + 1
      continue
    }
    return true
  }
  return false
}

function buildLineStarts(text) {
  const starts = [0]
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      starts.push(i + 1)
    }
  }
  return starts
}

function indexToLineNumber(lineStarts, index) {
  let lo = 0
  let hi = lineStarts.length - 1
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (lineStarts[mid] <= index) {
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return hi + 1
}

function looksTooShortOrGeneric(label, entityType) {
  const trimmed = label.trim()
  if (trimmed.length < 2) return true
  const lettersOnly = trimmed.replace(/[^\p{L}]/gu, '')
  const allCaps = lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase()
  if (trimmed.length < 4) return !allCaps
  return false
}

function labelRegex(label) {
  const trimmed = label.trim()
  const pattern = escapeRegExp(trimmed).replace(/\\ /g, '\\s+').replace(/ /g, '\\s+')
  const lettersOnly = trimmed.replace(/[^\p{L}]/gu, '')
  const allCaps = lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase()
  const isSingleWordShort = !/\s/.test(trimmed) && trimmed.length <= 7
  const flags = allCaps || isSingleWordShort ? 'gu' : 'giu'
  return new RegExp(`(?<![\\p{L}\\p{N}])(${pattern})(?![\\p{L}\\p{N}])`, flags)
}

async function buildEntityIndex() {
  const byNormalizedLabel = new Map()
  const entities = []

  for (const entityDir of DEMOS_ENTITY_DIRS) {
    const files = await listMarkdownFiles(entityDir.dir)
    for (const filePath of files) {
      const raw = await fs.readFile(filePath, 'utf-8')
      const parsed = parseFrontmatter(raw)
      if (!parsed.ok) continue

      const { frontmatter } = parsed
      const demos = frontmatter?.demos ?? null
      const id = demos?.id ?? null
      const type = demos?.type ?? entityDir.type
      if (!id || (type !== 'person' && type !== 'org')) continue

      const slug = path.basename(filePath, '.md')
      const url = `${entityDir.urlBase}${slug}`

      const labels = new Set()
      if (typeof frontmatter.title === 'string') {
        labels.add(frontmatter.title)
        const withoutParen = frontmatter.title.replace(/\s*\([^)]*\)\s*$/, '').trim()
        if (withoutParen && withoutParen !== frontmatter.title) {
          labels.add(withoutParen)
        }
      }

      if (Array.isArray(demos?.aliases)) {
        for (const alias of demos.aliases) {
          if (typeof alias === 'string' && alias.trim()) labels.add(alias.trim())
        }
      }

      const entity = { id, type, url, filePath, labels: [...labels] }
      entities.push(entity)

      for (const label of labels) {
        if (looksTooShortOrGeneric(label, type)) continue
        const normalized = normalizeLabel(label)
        const existing = byNormalizedLabel.get(normalized)
        if (!existing) {
          byNormalizedLabel.set(normalized, [{ id, type, url, label }])
        } else {
          existing.push({ id, type, url, label })
        }
      }
    }
  }

  const labelEntries = []
  const ambiguous = []
  for (const [normalized, items] of byNormalizedLabel.entries()) {
    const uniqueIds = new Set(items.map((item) => item.id))
    if (uniqueIds.size > 1) {
      ambiguous.push({ normalized, items })
      continue
    }
    const item = items[0]
    labelEntries.push({
      normalized,
      label: item.label,
      id: item.id,
      type: item.type,
      url: item.url,
      regex: labelRegex(item.label)
    })
  }

  labelEntries.sort((a, b) => b.label.length - a.label.length)
  return { entities, labelEntries, ambiguous }
}

function selectNonOverlappingMatches(matches) {
  matches.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))
  const selected = []
  let currentEnd = -1
  for (const match of matches) {
    if (match.start < currentEnd) continue
    selected.push(match)
    currentEnd = match.end
  }
  return selected
}

function findUnlinkedMatches({ bodyMarkdown, excludedRanges, selfId, labelEntries, lineStarts }) {
  const matches = []

  for (const entry of labelEntries) {
    if (selfId && entry.id === selfId) continue
    for (const match of bodyMarkdown.matchAll(entry.regex)) {
      const start = match.index ?? 0
      if (isExcluded(start, excludedRanges)) continue
      const text = match[1]
      const end = start + text.length
      const line = lineStarts ? indexToLineNumber(lineStarts, start) : null
      matches.push({ start, end, text, url: entry.url, id: entry.id, line })
    }
  }

  return selectNonOverlappingMatches(matches)
}

function applyMatches(bodyMarkdown, matches) {
  if (matches.length === 0) {
    return { changed: false, bodyMarkdown, replacements: 0 }
  }

  let next = bodyMarkdown
  for (const match of [...matches].sort((a, b) => b.start - a.start)) {
    next = `${next.slice(0, match.start)}[${match.text}](${match.url})${next.slice(match.end)}`
  }

  return { changed: next !== bodyMarkdown, bodyMarkdown: next, replacements: matches.length }
}

async function scan() {
  const { labelEntries, ambiguous } = await buildEntityIndex()

  if (ambiguous.length > 0) {
    console.error('WARN: ambiguous labels (skipping):')
    for (const item of ambiguous) {
      const labels = item.items.map((e) => `${e.label} -> ${e.url}`).join(' | ')
      console.error(`  - "${item.normalized}": ${labels}`)
    }
    console.error('')
  }

  const findings = []
  let changedFiles = 0
  let replacements = 0

  for (const dir of DEMOS_NOTE_DIRS_TO_SCAN) {
    const files = await listMarkdownFiles(dir)
    for (const filePath of files) {
      const raw = await fs.readFile(filePath, 'utf-8')
      const parsed = parseFrontmatter(raw)
      if (!parsed.ok) continue

      const { frontmatter, bodyMarkdown } = parsed
      const selfId = frontmatter?.demos?.id ?? null

      const excludedRanges = buildExcludedRanges(bodyMarkdown)
      const lineStarts = buildLineStarts(bodyMarkdown)

      const matches = findUnlinkedMatches({ bodyMarkdown, excludedRanges, selfId, labelEntries, lineStarts })

      if (FIX_MODE) {
        const applied = applyMatches(bodyMarkdown, matches)
        if (applied.changed) {
          const nextRaw = `---\n${parsed.frontmatterYaml}\n---\n${applied.bodyMarkdown}`
          const written = await writeFileIfChanged(filePath, nextRaw)
          if (written.changed) {
            changedFiles += 1
            replacements += applied.replacements
          }
        }
        continue
      }

      for (const match of matches) {
        if (!match.line) continue
        findings.push({
          filePath,
          line: match.line,
          text: match.text,
          url: match.url,
          id: match.id
        })
      }
    }
  }

  if (FIX_MODE) {
    console.log(`Fixed: ${replacements} links added across ${changedFiles} files.`)
    return
  }

  findings.sort((a, b) => a.filePath.localeCompare(b.filePath) || a.line - b.line || a.text.localeCompare(b.text))

  for (const finding of findings) {
    console.log(`${path.relative(ROOT, finding.filePath)}:${finding.line} "${finding.text}" -> ${finding.url}`)
  }

  const byFile = new Map()
  const byEntity = new Map()
  for (const finding of findings) {
    byFile.set(finding.filePath, (byFile.get(finding.filePath) ?? 0) + 1)
    byEntity.set(finding.id, (byEntity.get(finding.id) ?? 0) + 1)
  }

  console.log('')
  console.log(
    `Summary: ${findings.length} unlinked mentions across ${byFile.size} files (${byEntity.size} unique entities).`
  )
  if (findings.length > 0) {
    process.exitCode = 2
  }
}

await scan()
