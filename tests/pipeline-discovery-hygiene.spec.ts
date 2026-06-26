import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

// Slice 2P (+ A4 clean break) — post-move discovery hygiene: ONE canonical reading surface
// (/pt/filosofia/louis-lavelle/introducao-a-ontologia/). The 12 legacy fr chapter pages stay built
// (removed in A5) but are NO LONGER redirect sources — A4 removed the redirect map and src/public/_redirects
// — and must not reappear through local search, LLM output, the sitemap, or the canonical pt navigation.
// reading-review/** stays fully excluded.
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const FR_DIR = path.resolve('src/louis-lavelle/introduction-a-l-ontologie')
const FR_HUB = path.resolve('src/louis-lavelle/introduction-a-l-ontologie.md')
const GEN = path.resolve('scripts/build-pipeline-segment-routes.py')
const FR_CHAPTER_PROSE = 'Il y a dans la seule énonciation du mot être une sorte'

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))

function builtExists(href: string): boolean {
  const h = href.replace(/\/$/, '') || '/'
  if (h === '/') return fs.existsSync(path.join(DIST, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${h}.html`)) || fs.existsSync(path.join(DIST, h, 'index.html'))
  )
}
const sitemap = () => fs.readFileSync(path.resolve(DIST, 'sitemap.xml'), 'utf-8')
const llms = () => {
  const p = path.resolve(DIST, 'llms-full.txt')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
}
test.describe('post-move discovery hygiene (Slice 2P + A4, one canonical pt reading surface)', () => {
  test('clean break (A4): no _redirects file maps the legacy fr chapters into the moved pt namespace', () => {
    // A4 removed the redirect map + src/public/_redirects entirely (old fr URLs may 404).
    expect(fs.existsSync(path.resolve('src/public/_redirects'))).toBe(false)
    expect(fs.existsSync(path.join(DIST, '_redirects'))).toBe(false)
    // the 12 legacy fr chapter pages still exist on disk (removed only in A5), now without any redirect
    const frStems = fs
      .readdirSync(FR_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
    expect(frStems.length).toBe(12)
  })

  test('the old fr edition is excluded from local search and LLM output (but stays built, legacy)', () => {
    // out of local search: every fr chapter AND the full-text fr hub carry search:false
    const frFiles = fs.readdirSync(FR_DIR).filter((f) => f.endsWith('.md'))
    for (const f of frFiles) {
      expect(fs.readFileSync(path.join(FR_DIR, f), 'utf-8'), f).toMatch(/^search:\s*false/m)
    }
    expect(fs.readFileSync(FR_HUB, 'utf-8'), 'fr hub').toMatch(/^search:\s*false/m)
    // out of LLM output: the fr chapter prose is gone (chapter pages AND the hub that inlines them);
    // the pt equivalent remains
    const text = llms()
    if (text) {
      expect(text.includes(FR_CHAPTER_PROSE)).toBe(false)
      expect(text.includes('na simples enunciação da palavra ser')).toBe(true) // pt canonical prose
    }
    // still built (legacy fr full text, removed in A5; no longer a redirect source after A4)
    expect(builtExists('/louis-lavelle/introduction-a-l-ontologie/00-01-002-etre')).toBe(true)
    expect(builtExists('/louis-lavelle/introduction-a-l-ontologie')).toBe(true)
  })

  test('old fr chapters are not canonical reading pages: out of the sitemap (legacy, not redirect-protected)', () => {
    expect(sitemap()).not.toMatch(/introduction-a-l-ontologie\/00-/)
  })

  test('the canonical pt surfaces never link back to old fr chapter pages', () => {
    // the pt hub and a pt segment page (with PipelineSegmentNav) carry no href to an fr chapter route
    const hub = fs.readFileSync(
      path.join(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/index.html'),
      'utf-8'
    )
    const seg = fs.readFileSync(
      path.join(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.html'),
      'utf-8'
    )
    for (const html of [hub, seg]) {
      expect(/href="[^"]*\/louis-lavelle\/introduction-a-l-ontologie\/00-/.test(html)).toBe(false)
    }
  })

  test('the pt hub + segments are the discoverable, indexable reading surface', () => {
    // pt hub indexable + in the sitemap
    const hub = fs.readFileSync(
      path.join(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/index.html'),
      'utf-8'
    )
    expect(hub).not.toMatch(/name="robots"[^>]*content="noindex"/)
    expect(sitemap()).toMatch(/introducao-a-ontologia\/?<\/loc>/)
    // 99 pt segment pages build and are indexable
    const pt = read(META).segments.filter((s: any) => s.language === 'pt')
    expect(pt.length).toBe(99)
    for (const s of pt) expect(builtExists(`/${s.routePath}`)).toBe(true)
    const seg = fs.readFileSync(
      path.join(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.html'),
      'utf-8'
    )
    expect(seg).not.toMatch(/name="robots"[^>]*content="noindex"/)
  })

  test('reading-review/** stays out of the sitemap, search, and LLM output', () => {
    expect(sitemap().includes('/reading-review/')).toBe(false)
    const text = llms()
    if (text) expect(text.includes('reading-review/')).toBe(false)
    // a reading-review demo page is noindex + search:false
    const demo = fs.readFileSync(
      path.join(DIST, 'reading-review/introduction-a-l-ontologie-reader.html'),
      'utf-8'
    )
    expect(demo).toMatch(/name="robots"[^>]*content="noindex"/)
    expect(
      fs.readFileSync(
        path.resolve('src/reading-review/introduction-a-l-ontologie-reader.md'),
        'utf-8'
      )
    ).toMatch(/^search:\s*false/m)
  })

  test('routePath stays presentation, canonicalId stays identity; generated pages idempotent', () => {
    // the pt pages carry the canonicalId join key; routePath is only the public URL/filename
    const seg = fs.readFileSync(
      path.resolve('src/pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.md'),
      'utf-8'
    )
    expect(seg).toContain(
      'pipelineCanonicalId: "louis-lavelle/introduction-a-l-ontologie/00-01-002-008"'
    )
    // regenerating the family is a clean no-op (prose/pages unchanged)
    expect(execFileSync('python3', [GEN], { encoding: 'utf-8' })).toContain(
      'No segment-routes changes.'
    )
  })
})
