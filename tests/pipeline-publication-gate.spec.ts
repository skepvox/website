import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

// Slice 2K/2L — stability-aware publication gate, now exercised by the live migration. The gate
// (scripts/pipeline_gate.py) decides per-segment visibility from pipeline metadata: eligible (public)
// iff urlStability=="stable" AND publicSlug present; everything else hidden (buffer/noindex, out of
// sitemap/search/LLM). The pipeline has minted the pt edition, so the 99 pt pages are now INDEXABLE in
// the public namespace; the reading-review/** demo surfaces stay noindex/excluded.
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const GATE = path.resolve('scripts/pipeline_gate.py')
const GEN_SCRIPT = path.resolve('scripts/build-pipeline-segment-routes.py')
const GEN_DIR = path.resolve('src/pt/filosofia/louis-lavelle/introducao-a-ontologia')
const ORIGIN = 'https://www.skepvox.com'

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const gate = (seg: object) =>
  JSON.parse(execFileSync('python3', [GATE, JSON.stringify(seg)], { encoding: 'utf-8' }))

const sitemapUrls = () =>
  new Set(
    [
      ...fs
        .readFileSync(path.resolve(DIST, 'sitemap.xml'), 'utf-8')
        .matchAll(/<loc>([^<]+)<\/loc>/g)
    ].map((m) => m[1].replace(ORIGIN, ''))
  )

test.describe('pipeline publication gate (Slice 2K/2L, stability-aware; pt minted & public)', () => {
  test('the gate hides draft/provisional/no-publicSlug and only opens stable+publicSlug', () => {
    const HIDDEN = { eligible: false, buffer: true, noindex: true, search: false, sitemap: false }
    expect(gate({ urlStability: 'draft', publicSlug: null })).toMatchObject(HIDDEN)
    expect(gate({ urlStability: 'provisional', publicSlug: null })).toMatchObject(HIDDEN)
    expect(gate({ urlStability: 'stable', publicSlug: null })).toMatchObject(HIDDEN) // defensive
    expect(gate({ urlStability: 'stable', publicSlug: 'paragrafo-7' })).toMatchObject({
      eligible: true,
      buffer: false,
      noindex: false,
      search: true,
      sitemap: true,
      index: true,
      llm: true
    })
  })

  test('the vendored export now has 99 stable pt routes with publicSlug; fr stays draft/null', () => {
    const segs = read(META).segments
    const pt = segs.filter((s: any) => s.language === 'pt')
    const fr = segs.filter((s: any) => s.language === 'fr')
    expect(pt.length).toBe(99)
    expect(fr.length).toBe(99)
    for (const s of pt) {
      expect(s.urlStability).toBe('stable')
      expect(s.publicSlug).toBeTruthy()
      expect(gate(s).eligible).toBe(true)
    }
    for (const s of fr) {
      expect(s.urlStability).toBe('draft')
      expect(s.publicSlug).toBeNull()
      expect(gate(s).eligible).toBe(false)
    }
  })

  test('the generator is wired through the gate; the 99 pt pages are now INDEXABLE + idempotent', () => {
    const src = fs.readFileSync(GEN_SCRIPT, 'utf-8')
    expect(src).toContain('from pipeline_gate import route_visibility')
    expect(src).toContain('route_visibility(rec)')

    const files = fs.readdirSync(GEN_DIR).filter((f) => f.endsWith('.md') && f !== 'index.md')
    expect(files.length).toBe(99)
    // stable -> indexable: no buffer / search:false / robots noindex in any generated page
    for (const f of files) {
      const t = fs.readFileSync(path.join(GEN_DIR, f), 'utf-8')
      expect(t).not.toMatch(/^buffer: true$/m)
      expect(t).not.toMatch(/^search: false$/m)
      expect(t).not.toContain("content: 'noindex'")
      expect(t).toContain('pipelineCanonicalId:') // (canonicalId, language) join, not routePath
    }
    const out = execFileSync('python3', [GEN_SCRIPT], { encoding: 'utf-8' })
    expect(out).toContain('No segment-routes changes.')
  })

  test('public pt pages are indexable (no noindex, in LLM); reading-review/** stays noindex/excluded', () => {
    // a built public pt page carries NO robots-noindex
    const pub = fs.readFileSync(
      path.join(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.html'),
      'utf-8'
    )
    expect(pub).not.toMatch(/name="robots"[^>]*content="noindex"/)

    // a reading-review demo page stays noindex and out of the sitemap
    const demo = fs.readFileSync(
      path.join(DIST, 'reading-review/introduction-a-l-ontologie-reader.html'),
      'utf-8'
    )
    expect(demo).toMatch(/name="robots"[^>]*content="noindex"/)
    expect([...sitemapUrls()].some((u) => u.startsWith('/reading-review/'))).toBe(false)

    // LLM output: public pt family included; reading-review/** excluded
    const llms = path.resolve(DIST, 'llms-full.txt')
    if (fs.existsSync(llms)) {
      const text = fs.readFileSync(llms, 'utf-8')
      expect(text.includes('introducao-a-ontologia')).toBe(true)
      expect(text.includes('reading-review/')).toBe(false)
    }
  })
})
