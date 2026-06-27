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

const LAVELLE = 'louis-lavelle/introduction-a-l-ontologie'
const BRAS = 'machado-de-assis/bras-cubas'

const artifact = () => JSON.parse(fs.readFileSync(ARTIFACT, 'utf-8'))
const workSegs = (workId: string) => artifact().segments.filter((s: any) => s.workId === workId)

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

  test('Lavelle: 198 records, 99 fr + 99 pt, paired by canonicalId', () => {
    const segs = workSegs(LAVELLE)
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

  test('every Lavelle metadata record has a matching pipeline prose leaf', () => {
    for (const s of workSegs(LAVELLE)) {
      const leaf = path.join(PIPE_PROSE, s.language, `${s.segmentPrefix}.md`)
      expect(fs.existsSync(leaf), leaf).toBe(true)
    }
  })

  test('every Lavelle pipeline prose leaf has a matching metadata record', () => {
    const recs = new Set(workSegs(LAVELLE).map((s: any) => `${s.language}/${s.segmentPrefix}`))
    for (const language of ['fr', 'pt']) {
      for (const f of fs.readdirSync(path.join(PIPE_PROSE, language))) {
        if (!f.endsWith('.md')) continue
        expect(recs.has(`${language}/${f.replace(/\.md$/, '')}`), `${language}/${f}`).toBe(true)
      }
    }
  })

  test('routePath is unique across all records (both works)', () => {
    const segs = artifact().segments
    expect(new Set(segs.map((s: any) => s.routePath)).size).toBe(segs.length)
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

  test('the legacy fr edition (12 chapter pages + hub) is gone — removed in A5; nothing builds under /louis-lavelle/', () => {
    expect(fs.existsSync(path.resolve('src/louis-lavelle/introduction-a-l-ontologie'))).toBe(false)
    expect(builtExists('/louis-lavelle/introduction-a-l-ontologie')).toBe(false)
    expect(fs.existsSync(path.join(DIST, 'louis-lavelle'))).toBe(false)
  })

  test('pipeline-export is consumed only by the owned reader-shell components + section cards', () => {
    // The vendored export feeds the buffer-only review prototypes (2C/2D map, 2G full-work reader), the
    // live owned reader shell: PipelineReaderHeader (Slice F1 leaf location path), PipelineSegmentNav
    // (leaf prev/next/up) and PipelineWorkContents (the pt work-hub contents map), AND the filosofia +
    // literatura author-hub work cards (filosofia-cards.ts / literatura-cards.ts — route + title sourced
    // from the export). The legacy hand-authored book map (WorkContents / segment-manifest) was retired
    // with the /literatura/ surface in B5.
    expect(codeRefs('pipeline-export-segments')).toEqual([
      'theme/components/PipelineExportReview.vue',
      'theme/components/PipelineReaderHeader.vue',
      'theme/components/PipelineReaderPreview.vue',
      'theme/components/PipelineSegmentNav.vue',
      'theme/components/PipelineWorkContents.vue',
      'theme/components/filosofia-cards.ts',
      'theme/components/literatura-cards.ts'
    ])
  })
})

// B2 — the multi-work ingestion invariants + a few representative Brás Cubas samples, in ONE place (not
// duplicated across specs, not a per-book explosion). The reshaper/route/page mechanics are already
// covered generically by the existing specs; these lock the second work's identity + projection.
test.describe('pipeline-export multi-work ingestion (B2: Lavelle + Brás Cubas)', () => {
  test('the artifact is multi-work: works[] lists both works; the singular work key is gone', () => {
    const a = artifact()
    expect(Array.isArray(a.works)).toBe(true)
    expect('work' in a).toBe(false)
    expect(a.works.map((w: any) => w.workId).sort()).toEqual([BRAS, LAVELLE].sort())
  })

  test('Brás Cubas: 163 pt records, prefix-only routePath, PUBLISHED stable WITHOUT a publicSlug (B3)', () => {
    const segs = workSegs(BRAS)
    expect(segs.length).toBe(163)
    expect(segs.every((s: any) => s.language === 'pt')).toBe(true)
    for (const s of segs) {
      // prefix-only public leaf: bare segmentPrefix, no slug tail
      expect(s.routePath).toBe(`pt/literatura/machado-de-assis/bras-cubas/${s.segmentPrefix}`)
      expect(s.urlStability).toBe('stable') // B3: published
      expect(s.publicSlug).toBeNull() // ...without minting a publicSlug — segmentPrefix IS the permanent leaf
    }
  })

  test('the work-specific route prefix lives in route_base.py, never hardcoded in a component', () => {
    expect(fs.readFileSync(path.resolve('scripts/route_base.py'), 'utf-8')).toContain(
      'pt/literatura/machado-de-assis/bras-cubas'
    )
    // No component ASSEMBLES the prefix in code (doc comments may reference the route — stripped, matching
    // the pipeline-route-base.spec convention). Components derive every href from routePath (the data).
    const stripComments = (s: string) =>
      s
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1')
    const comps = path.resolve('.vitepress/theme/components')
    for (const f of fs.readdirSync(comps).filter((n) => /\.(vue|ts)$/.test(n))) {
      expect(
        stripComments(fs.readFileSync(path.join(comps, f), 'utf-8')).includes(
          'pt/literatura/machado-de-assis/bras-cubas'
        ),
        f
      ).toBe(false)
    }
  })

  test('representative authored titles: identity preserved, never the body sentence', () => {
    const by = new Map(workSegs(BRAS).map((s: any) => [s.segmentPrefix, s]))
    // ch 53: the authored dotted marker — not empty, not the Virgília body sentence
    expect(by.get('00-00-053-056').displayTitle).toBe('.......')
    expect(by.get('00-00-053-056').displayTitle.includes('Virgília')).toBe(false)
    // ch 83 / 110: authored numeral titles preserved verbatim
    expect(by.get('00-00-083-086').displayTitle).toBe('13')
    expect(by.get('00-00-110-113').displayTitle).toBe('31')
    // front matter + last chapter
    expect(by.get('00-00-000-001').displayTitle).toBe('Dedicatória')
    expect(by.get('00-00-160-163').displayTitle).toBe('Das negativas')
  })

  test('Brás Cubas is chapter-level (flat): 160 single-chapter body groupPaths, 3 empty front-matter', () => {
    const segs = workSegs(BRAS)
    const body = segs.filter((s: any) => s.groupPath.length > 0)
    expect(body.length).toBe(160)
    expect(
      body.every((s: any) => s.groupPath.length === 1 && s.groupPath[0].kind === 'chapter')
    ).toBe(true)
    expect(segs.filter((s: any) => s.groupPath.length === 0).length).toBe(3)
  })
})
