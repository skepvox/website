import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { LAVELLE_WORK_ID } from './pipeline-helpers'

// stability-aware publication gate. The gate (scripts/pipeline_gate.py) decides
// per-segment visibility from pipeline metadata: eligible (public) iff urlStability=="stable" — the
// pipeline's explicit publish signal, set under either model (slug-tail freezes a publicSlug; prefix-only
// needs none, its segmentPrefix being the permanent public leaf). Everything else (draft/provisional)
// stays hidden (buffer/noindex, out of sitemap/search/LLM). The reading-review/** demo surfaces stay
// noindex/excluded.
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

test.describe('pipeline publication gate (stability-aware; pt minted & public)', () => {
  test('the gate opens any stable route (with OR without publicSlug) and hides everything else', () => {
    const HIDDEN = { eligible: false, buffer: true, noindex: true, search: false, sitemap: false }
    const PUBLIC = {
      eligible: true,
      buffer: false,
      noindex: false,
      search: true,
      sitemap: true,
      index: true,
      llm: true
    }
    expect(gate({ urlStability: 'draft', publicSlug: null })).toMatchObject(HIDDEN)
    expect(gate({ urlStability: 'provisional', publicSlug: null })).toMatchObject(HIDDEN)
    // B3: a prefix-only public work is stable WITHOUT a publicSlug (segmentPrefix is the permanent leaf).
    expect(gate({ urlStability: 'stable', publicSlug: null })).toMatchObject(PUBLIC)
    // a slug-tail public work is stable WITH a frozen publicSlug — also eligible.
    expect(gate({ urlStability: 'stable', publicSlug: 'paragrafo-7' })).toMatchObject(PUBLIC)
  })

  test('the vendored export now has 99 stable pt routes with publicSlug; fr stays draft/null', () => {
    const segs = read(META).segments
    const LAV = LAVELLE_WORK_ID
    const pt = segs.filter((s: any) => s.workId === LAV && s.language === 'pt')
    const fr = segs.filter((s: any) => s.workId === LAV && s.language === 'fr')
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

  test('B3: Brás Cubas is published prefix-only — hubs in sitemap, leaves indexable+crawlable but pruned', () => {
    const urls = sitemapUrls()
    // section / author / work hubs are indexable + listed in the sitemap (same posture as Lavelle's hubs)
    expect(urls.has('/pt/literatura/')).toBe(true)
    expect(urls.has('/pt/literatura/machado-de-assis/')).toBe(true)
    expect(urls.has('/pt/literatura/machado-de-assis/bras-cubas/')).toBe(true)
    const section = fs.readFileSync(path.join(DIST, 'pt/literatura/index.html'), 'utf-8')
    expect(section).toContain('Rio de Janeiro, Brasil · 1839–1908 †')
    expect(section).not.toContain('Literatura em português, reunida')
    expect(section).not.toContain('>Autores<')
    const author = fs.readFileSync(
      path.join(DIST, 'pt/literatura/machado-de-assis/index.html'),
      'utf-8'
    )
    expect(author).toContain('Memórias póstumas de Brás Cubas')
    expect(author).toContain('1881')
    expect(author).not.toContain('<p>Rio de Janeiro, Brasil · 1839–1908 †</p>')
    expect(author).not.toContain('Romance em português')
    expect(author).not.toContain('163 trechos')
    expect(author).not.toContain('>Obras<')
    // representative leaf (ch 53): indexable (no robots noindex) + crawlable (real prose), but sitemap-pruned
    const dir = path.join(DIST, 'pt/literatura/machado-de-assis/bras-cubas')
    const html = fs.readFileSync(path.join(dir, '00-00-053-056.html'), 'utf-8')
    expect(html).not.toMatch(/name="robots"[^>]*content="noindex"/)
    expect(html).toContain('Virgília é que já se não lembrava') // the real prose body
    expect(urls.has('/pt/literatura/machado-de-assis/bras-cubas/00-00-053-056')).toBe(false) // pruned
    // prefix-only route shape: every built leaf is a bare segmentPrefix, NO slug tail
    const leaves = fs.readdirSync(dir).filter((f) => /\.html$/.test(f) && f !== 'index.html')
    expect(leaves.length).toBe(163)
    expect(leaves.every((f) => /^\d{2}-\d{2}-\d{3}-\d{3}\.html$/.test(f))).toBe(true)
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

    // the surviving reading-review buffer page (the reader-icon harness; the export-preview prototypes
    // were retired in the consolidation pass) stays noindex and out of the sitemap
    const demo = fs.readFileSync(
      path.join(DIST, 'reading-review/reader-icon-harness.html'),
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
