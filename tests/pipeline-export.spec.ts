import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Slice 2B — vendor the book-pipeline export + a website-local reshape, no routes.
// docs/website-export-ingestion-assessment.md §2/§7. Data foundation only: a separate
// `source:"pipeline-export"` artifact wired into no component, generating no page/route.
// These tests lock the reshape, the metadata<->prose join, and that nothing live changed.
const ARTIFACT = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const DIST = path.resolve('.vitepress/dist')
const PIPE_PROSE = path.resolve(
  '..',
  'skepvox-book-pipeline',
  'export',
  'prose',
  'louis-lavelle',
  'introduction-a-l-ontologie'
)
const SRC_WORK = path.resolve('src/louis-lavelle/introduction-a-l-ontologie')

const artifact = () => JSON.parse(fs.readFileSync(ARTIFACT, 'utf-8'))

// cleanUrls: dir routes -> index.html, leaf routes -> <href>.html
function builtExists(href: string): boolean {
  if (href.endsWith('/')) return fs.existsSync(path.join(DIST, href, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${href}.html`)) ||
    fs.existsSync(path.join(DIST, href, 'index.html'))
  )
}

// Files under .vitepress that reference `needle` in code (data/dist/cache dirs excluded).
function codeRefs(needle: string): string[] {
  const found: string[] = []
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['data', 'dist', 'cache'].includes(e.name)) continue
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(ts|vue|js|mjs)$/.test(e.name) && fs.readFileSync(p, 'utf-8').includes(needle))
        found.push(path.relative(path.resolve('.vitepress'), p))
    }
  }
  walk(path.resolve('.vitepress'))
  return found.sort()
}

test.describe('pipeline-export ingestion (Slice 2B: vendor + reshape, no routes)', () => {
  test('the generator is deterministic / idempotent', () => {
    const out = execFileSync('python3', ['scripts/build-pipeline-export.py'], {
      encoding: 'utf-8'
    }).trim()
    expect(out).toBe('No pipeline-export changes.')
  })

  test('198 records, 99 fr + 99 pt, paired by canonicalId', () => {
    const segs = artifact().segments
    expect(segs.length).toBe(198)
    const fr = segs.filter((s: any) => s.language === 'fr')
    const pt = segs.filter((s: any) => s.language === 'pt')
    expect(fr.length).toBe(99)
    expect(pt.length).toBe(99)
    const frIds = new Set(fr.map((s: any) => s.canonicalId))
    const ptIds = new Set(pt.map((s: any) => s.canonicalId))
    expect(frIds.size).toBe(99)
    expect([...frIds].sort()).toEqual([...ptIds].sort())
  })

  test('every metadata record has a matching pipeline prose leaf', () => {
    for (const s of artifact().segments) {
      const leaf = path.join(PIPE_PROSE, s.language, `${s.segmentPrefix}.md`)
      expect(fs.existsSync(leaf), leaf).toBe(true)
    }
  })

  test('every pipeline prose leaf has a matching metadata record', () => {
    const recs = new Set(artifact().segments.map((s: any) => `${s.language}/${s.segmentPrefix}`))
    for (const language of ['fr', 'pt']) {
      for (const f of fs.readdirSync(path.join(PIPE_PROSE, language))) {
        if (!f.endsWith('.md')) continue
        expect(recs.has(`${language}/${f.replace(/\.md$/, '')}`), `${language}/${f}`).toBe(true)
      }
    }
  })

  test('routePath is unique across all 198 records', () => {
    const segs = artifact().segments
    expect(new Set(segs.map((s: any) => s.routePath)).size).toBe(198)
  })

  test('the artifact and every record are tagged source:"pipeline-export"', () => {
    const a = artifact()
    expect(a.source).toBe('pipeline-export')
    expect(a.segments.every((s: any) => s.source === 'pipeline-export')).toBe(true)
  })

  test('authored groupPath carries label/title with inferred:false', () => {
    const segs = artifact().segments
    const levels = segs.flatMap((s: any) => s.groupPath)
    expect(levels.length).toBeGreaterThan(0)
    expect(
      levels.every(
        (l: any) => l.inferred === false && typeof l.label === 'string' && l.label.length > 0
      )
    ).toBe(true)
    const part1 = levels.find((l: any) => l.kind === 'part' && l.index === 1)
    expect(part1.label).toBe('Première partie')
    expect(part1.title).toBe("Les catégories premières de l'ontologie")
    expect(part1.inferred).toBe(false)
  })

  test('no prose body and no private markers leak', () => {
    const a = artifact()
    const prosey = a.segments.filter((s: any) =>
      ['body', 'prose', 'text', 'content', 'description', 'excerpt'].some((k) => k in s)
    )
    expect(prosey).toEqual([])
    const blob = JSON.stringify(a)
    for (const tok of ['read-at', '==', '%% review', '[!review]', '[!dt]']) {
      expect(blob.includes(tok), tok).toBe(false)
    }
  })

  test('routePath is data only — no record generates an href', () => {
    const segs = artifact().segments
    expect(segs.every((s: any) => typeof s.routePath === 'string' && s.routePath.length > 0)).toBe(
      true
    )
    expect(segs.some((s: any) => 'href' in s)).toBe(false)
  })

  test('the 12 live fr chapter routes (and the hub) still resolve', () => {
    const work = '/louis-lavelle/introduction-a-l-ontologie'
    expect(builtExists(work)).toBe(true)
    const stems = fs
      .readdirSync(SRC_WORK)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
    expect(stems.length).toBe(12)
    for (const stem of stems) expect(builtExists(`${work}/${stem}`), stem).toBe(true)
  })

  test('pipeline-export is consumed only by review-only components; segment-manifest consumers unchanged', () => {
    // The vendored export is consumed ONLY by buffer-only review components (none wired into any live
    // work hub): the 2C/2D map and the 2G full-work reader prototype. segment-manifest's own consumers
    // (the live WorkContents path) are unchanged.
    expect(codeRefs('pipeline-export-segments')).toEqual([
      'theme/components/PipelineExportReview.vue',
      'theme/components/PipelineReaderPreview.vue',
      'theme/components/PipelineSegmentRoute.vue'
    ])
    expect(codeRefs('segment-manifest')).toEqual([
      'theme/components/WorkContents.vue',
      'theme/components/WorkContentsMount.vue'
    ])
    const mount = fs.readFileSync(
      path.resolve('.vitepress/theme/components/WorkContentsMount.vue'),
      'utf-8'
    )
    expect(mount).toContain(
      "new Set(['louis-lavelle/de-l-acte.md', 'literatura/machado-de-assis/bras-cubas.md'])"
    )
    expect(mount.includes('introduction-a-l-ontologie')).toBe(false)
  })
})
