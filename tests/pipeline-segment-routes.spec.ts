import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice 2J — the real 99-segment route family for Introdução à ontologia, kept HIDDEN.
// docs/introduction-a-ontologia-live-migration-plan.md §4(ii)/§5. pt review edition generated under
// src/reading-review/introducao-a-ontologia/ behind buffer:true / search:false / noindex, out of
// sitemap / local search / LLM. The 12 live fr chapter pages + hub are untouched; nothing is published.
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const GEN_DIR = path.resolve('src/reading-review/introducao-a-ontologia')
const REDIRECTS = path.resolve('src/public/_redirects')
const ORIGIN = 'https://www.skepvox.com'

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const ptSegments = () => read(META).segments.filter((s: any) => s.language === 'pt')
// the hidden review route = reading-review namespace + the real pt routePath leaf
const hiddenRoute = (s: any) =>
  `/reading-review/introducao-a-ontologia/${s.routePath.split('/').pop()}`

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

test.describe('pipeline-export hidden 99-segment route family (Slice 2J, buffer/noindex)', () => {
  test('all 99 hidden pt segment routes build (one generated page each)', () => {
    const pt = ptSegments()
    expect(pt.length).toBe(99)
    for (const s of pt) expect(builtExists(hiddenRoute(s)), hiddenRoute(s)).toBe(true)
    // exactly 99 generated source pages, all carrying the generated marker + hidden frontmatter
    const files = fs.readdirSync(GEN_DIR).filter((f) => f.endsWith('.md'))
    expect(files.length).toBe(99)
    for (const f of files) {
      const t = fs.readFileSync(path.join(GEN_DIR, f), 'utf-8')
      expect(t).toContain('generated: pipeline-segment-routes')
      expect(t).toMatch(/^buffer: true$/m)
      expect(t).toMatch(/^search: false$/m)
      expect(t).toContain("name: 'robots', content: 'noindex'")
      expect(t).toContain('pipelineCanonicalId:') // (canonicalId, language) join, not routePath
    }
  })

  test('the 12 live fr chapter routes (and the hub) still resolve', () => {
    const work = '/louis-lavelle/introduction-a-l-ontologie'
    expect(builtExists(work)).toBe(true)
    const stems = fs
      .readdirSync(path.resolve('src/louis-lavelle/introduction-a-l-ontologie'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
    expect(stems.length).toBe(12)
    for (const stem of stems) expect(builtExists(`${work}/${stem}`), stem).toBe(true)
  })

  test('the new routes are noindex and out of sitemap / search / LLM', () => {
    const pt = ptSegments()
    // noindex on a sample built page
    const sample = fs.readFileSync(
      path.join(DIST, 'reading-review/introducao-a-ontologia/00-01-002-008-paragrafo-7.html'),
      'utf-8'
    )
    expect(sample).toMatch(/name="robots"[^>]*content="noindex"/)
    // none of the 99 hidden routes appear in the sitemap
    const urls = sitemapUrls()
    for (const s of pt) expect(urls.has(hiddenRoute(s)), hiddenRoute(s)).toBe(false)
    expect([...urls].some((u) => u.includes('introducao-a-ontologia'))).toBe(false)
    // out of LLM output (reading-review/** is ignored)
    const llms = path.resolve(DIST, 'llms-full.txt')
    if (fs.existsSync(llms)) {
      expect(fs.readFileSync(llms, 'utf-8').includes('introducao-a-ontologia')).toBe(false)
    }
  })

  test('the family is isolated: reading-nav, segment-manifest, and the redirect-map are unaffected', () => {
    const readingNav = read(path.resolve('.vitepress/theme/data/reading-nav.json'))
    expect(Object.keys(readingNav).some((k) => k.includes('introducao-a-ontologia'))).toBe(false)
    expect(Object.keys(readingNav).some((k) => k.includes('reading-review'))).toBe(false)

    const manifest = read(path.resolve('.vitepress/theme/data/segment-manifest.json'))
    const blob = JSON.stringify(manifest)
    expect(blob.includes('introducao-a-ontologia')).toBe(false)

    // WorkContentsMount allowlist unchanged (no public WorkContents rewiring)
    const mount = fs.readFileSync(
      path.resolve('.vitepress/theme/components/WorkContentsMount.vue'),
      'utf-8'
    )
    expect(mount).toContain(
      "new Set(['louis-lavelle/de-l-acte.md', 'literatura/machado-de-assis/bras-cubas.md'])"
    )

    // redirect-map remains not-enabled; no _redirects
    const rmap = read(
      path.resolve('.vitepress/theme/data/pipeline-redirect-map-introduction-a-l-ontologie.json')
    )
    expect(rmap.status).toBe('not-enabled')
    expect(fs.existsSync(REDIRECTS)).toBe(false)
  })

  test('routePath is never identity: pages join by (canonicalId, language) and render no anchors', async ({
    page
  }) => {
    // the component joins on canonicalId, not routePath
    const comp = fs.readFileSync(
      path.resolve('.vitepress/theme/components/PipelineSegmentRoute.vue'),
      'utf-8'
    )
    expect(comp).toContain('s.canonicalId === canonicalId.value && s.language === lang.value')

    // a LOADED segment (in the preview window) renders prose; no anchors anywhere in the component
    await page.goto('/reading-review/introducao-a-ontologia/00-01-002-008-paragrafo-7')
    const leaf = page.locator('[data-source="pipeline-export"]')
    await expect(leaf).toHaveAttribute('data-segment', '00-01-002-008')
    await expect(leaf).toHaveAttribute('data-loaded', 'true')
    await expect(
      page.getByText('na simples enunciação da palavra ser', { exact: false })
    ).toBeVisible()
    await expect(leaf.locator('a')).toHaveCount(0)

    // an UNLOADED segment renders metadata + the not-vendored notice, no prose
    await page.goto('/reading-review/introducao-a-ontologia/00-00-000-001-advertencia')
    const leaf2 = page.locator('[data-source="pipeline-export"]')
    await expect(leaf2).toHaveAttribute('data-segment', '00-00-000-001')
    await expect(leaf2).toHaveAttribute('data-loaded', 'false')
    await expect(page.locator('[data-testid="pe-route-notice"]')).toBeVisible()
    await expect(leaf2.locator('.pe-route__prose')).toHaveCount(0)
    await expect(leaf2.locator('a')).toHaveCount(0)
  })
})
