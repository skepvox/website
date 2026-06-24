import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

// Slice 2K — stability-aware publication gate. Makes the publication switch explicit + testable
// BEFORE any public flip. The gate (scripts/pipeline_gate.py) decides per-segment visibility from
// pipeline metadata: eligible (public) iff urlStability=="stable" AND publicSlug present; everything
// else hidden (buffer/noindex, out of sitemap/search/LLM). It never mints publicSlug or changes
// urlStability. The 99 generated pt pages are wired through it; all stay hidden today.
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const GATE = path.resolve('scripts/pipeline_gate.py')
const GEN_SCRIPT = path.resolve('scripts/build-pipeline-segment-routes.py')
const GEN_DIR = path.resolve('src/reading-review/introducao-a-ontologia')
const REDIRECTS = path.resolve('src/public/_redirects')
const ORIGIN = 'https://www.skepvox.com'

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const gate = (seg: object) =>
  JSON.parse(execFileSync('python3', [GATE, JSON.stringify(seg)], { encoding: 'utf-8' }))

function builtExists(href: string): boolean {
  if (href.endsWith('/')) return fs.existsSync(path.join(DIST, href, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${href}.html`)) ||
    fs.existsSync(path.join(DIST, href, 'index.html'))
  )
}

const sitemapUrls = () =>
  new Set(
    [
      ...fs
        .readFileSync(path.resolve(DIST, 'sitemap.xml'), 'utf-8')
        .matchAll(/<loc>([^<]+)<\/loc>/g)
    ].map((m) => m[1].replace(ORIGIN, ''))
  )

test.describe('pipeline publication gate (Slice 2K, stability-aware, nothing public yet)', () => {
  test('the gate hides draft/provisional/no-publicSlug and only opens stable+publicSlug', () => {
    const HIDDEN = {
      eligible: false,
      buffer: true,
      noindex: true,
      search: false,
      sitemap: false,
      index: false,
      canonical: false,
      llm: false
    }
    expect(gate({ urlStability: 'draft', publicSlug: null })).toMatchObject(HIDDEN)
    expect(gate({ urlStability: 'provisional', publicSlug: null })).toMatchObject(HIDDEN)
    // defensive: stable without a publicSlug is still hidden
    expect(gate({ urlStability: 'stable', publicSlug: null })).toMatchObject(HIDDEN)
  })

  test('synthetic fixture: a stable segment WITH a publicSlug would become eligible (no real data changed)', () => {
    const v = gate({ urlStability: 'stable', publicSlug: 'paragrafo-7' })
    expect(v).toMatchObject({
      eligible: true,
      buffer: false,
      noindex: false,
      search: true,
      sitemap: true,
      index: true,
      canonical: true,
      llm: true
    })
    // the real export is unchanged: still no stable / no publicSlug anywhere
    const segs = read(META).segments
    expect(segs.some((s: any) => s.urlStability === 'stable')).toBe(false)
    expect(segs.some((s: any) => s.publicSlug)).toBe(false)
  })

  test('every real pt segment is hidden by the gate (urlStability draft, publicSlug null)', () => {
    const pt = read(META).segments.filter((s: any) => s.language === 'pt')
    expect(pt.length).toBe(99)
    for (const s of pt) {
      expect(s.urlStability).toBe('draft')
      expect(s.publicSlug).toBeNull()
    }
  })

  test('the generator is wired through the gate; the 99 pages stay hidden + idempotent', () => {
    const src = fs.readFileSync(GEN_SCRIPT, 'utf-8')
    expect(src).toContain('from pipeline_gate import route_visibility')
    expect(src).toContain('route_visibility(rec)')

    const files = fs.readdirSync(GEN_DIR).filter((f) => f.endsWith('.md'))
    expect(files.length).toBe(99)
    // every page reflects the gate's HIDDEN output (buffer + search:false + noindex)
    for (const f of files) {
      const t = fs.readFileSync(path.join(GEN_DIR, f), 'utf-8')
      expect(t).toMatch(/^buffer: true$/m)
      expect(t).toMatch(/^search: false$/m)
      expect(t).toContain("name: 'robots', content: 'noindex'")
    }
    // wiring is a no-op for today's all-draft data: regenerating leaves the tree clean
    const out = execFileSync('python3', [GEN_SCRIPT], { encoding: 'utf-8' })
    expect(out).toContain('No segment-routes changes.')
    expect(fs.readdirSync(GEN_DIR).filter((f) => f.endsWith('.md')).length).toBe(99)
  })

  test('nothing is public: redirects disabled, no relocation, live fr pages intact, family noindex', () => {
    // no redirect channel
    expect(fs.existsSync(REDIRECTS)).toBe(false)
    // not relocated to the public path yet
    expect(fs.existsSync(path.join(DIST, 'louis-lavelle/introducao-a-ontologia'))).toBe(false)
    // the 12 live fr chapter routes still resolve
    const work = '/louis-lavelle/introduction-a-l-ontologie'
    expect(builtExists(work)).toBe(true)
    const stems = fs
      .readdirSync(path.resolve('src/louis-lavelle/introduction-a-l-ontologie'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
    expect(stems.length).toBe(12)
    for (const stem of stems) expect(builtExists(`${work}/${stem}`), stem).toBe(true)
    // the hidden pt family still builds, noindexed and out of the sitemap
    const sampleRoute = '/reading-review/introducao-a-ontologia/00-01-002-008-paragrafo-7'
    expect(builtExists(sampleRoute)).toBe(true)
    const html = fs.readFileSync(path.join(DIST, `${sampleRoute}.html`), 'utf-8')
    expect(html).toMatch(/name="robots"[^>]*content="noindex"/)
    expect([...sitemapUrls()].some((u) => u.includes('introducao-a-ontologia'))).toBe(false)
  })
})
