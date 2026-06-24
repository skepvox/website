import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice 2G — full-work reader prototype (metadata-only overview + windowed prose).
// docs/website-export-ingestion-assessment.md §7. Proves the mature reader shape for the whole work
// on a buffer (noindex/unlisted/out-of-search) page WITHOUT loading all prose.
//
// PERFORMANCE BOUNDARY (asserted below): the full-work overview is built from
// pipeline-export-segments.json = metadata only (99 pt rows, NO bodies); prose is loaded ONLY for the
// small window (pipeline-preview-window.json, 5 segments). NO public segment route, NO migration.
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const WINDOW = path.resolve('.vitepress/theme/data/pipeline-preview-window.json')
const PAGE_SRC = path.resolve('src/reading-review/introduction-a-l-ontologie-reader.md')
const ORIGIN = 'https://www.skepvox.com'

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))

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

test.describe('pipeline-export reader prototype (Slice 2G, buffer/noindex, no route migration)', () => {
  test('performance boundary: full-work overview is metadata-only; prose is window-only', () => {
    const meta = read(META)
    const pt = meta.segments.filter((s: any) => s.language === 'pt')
    expect(pt.length).toBe(99)
    // the full-work source carries NO prose bodies (overview is metadata only)
    expect(meta.segments.every((s: any) => !('bodyHtml' in s))).toBe(true)
    // prose exists ONLY for the small window
    const win = read(WINDOW).segments
    expect(win.length).toBe(5)
    expect(win.every((s: any) => typeof s.bodyHtml === 'string' && s.bodyHtml.length > 0)).toBe(
      true
    )
  })

  test('the buffer page is non-public: noindex, out of sitemap, search, and llms', () => {
    const html = fs.readFileSync(
      path.resolve(DIST, 'reading-review/introduction-a-l-ontologie-reader.html'),
      'utf-8'
    )
    expect(html).toMatch(/name="robots"[^>]*content="noindex"/)
    expect(sitemapUrls().has('/reading-review/introduction-a-l-ontologie-reader')).toBe(false)
    expect(fs.readFileSync(PAGE_SRC, 'utf-8')).toMatch(/^search:\s*false/m)
    const llms = path.resolve(DIST, 'llms-full.txt')
    if (fs.existsSync(llms)) {
      const text = fs.readFileSync(llms, 'utf-8')
      expect(text.includes('introduction-a-l-ontologie-reader')).toBe(false)
      expect(text.includes('Pipeline reader prototype')).toBe(false)
    }
  })

  test('the reader page creates no routes; no hidden pt duplicate; redirects disabled', () => {
    expect(builtExists('/reading-review/introduction-a-l-ontologie-reader')).toBe(true)
    expect(builtExists('/reading-review/introduction-a-l-ontologie-window')).toBe(true) // earlier surfaces
    // the earlier HIDDEN pt family under reading-review/ is gone (relocated to the public namespace)
    expect(fs.existsSync(path.join(DIST, 'reading-review/introducao-a-ontologia'))).toBe(false)
    expect(
      builtExists('/louis-lavelle/introduction-a-l-ontologie/00-01-002-008-paragraphe-7')
    ).toBe(false)
    const urls = [...sitemapUrls()]
    expect(urls.some((u) => u.includes('introducao-a-ontologia'))).toBe(false)
    expect(urls.some((u) => /\/00-\d\d-\d\d\d-\d\d\d-/.test(u))).toBe(false)
  })

  test('the existing 12 live fr chapter routes (and the hub) still resolve', () => {
    const work = '/louis-lavelle/introduction-a-l-ontologie'
    expect(builtExists(work)).toBe(true)
    const stems = fs
      .readdirSync(path.resolve('src/louis-lavelle/introduction-a-l-ontologie'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
    expect(stems.length).toBe(12)
    for (const stem of stems) expect(builtExists(`${work}/${stem}`), stem).toBe(true)
  })

  test('WorkContents/ReadingNav/segment-manifest consumers are unchanged', () => {
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

  test('overview shows all 99 metadata rows; only the window is loaded; selection drives the pane (no nav, no import)', async ({
    page
  }) => {
    await page.goto('/reading-review/introduction-a-l-ontologie-reader')
    const url = page.url()
    const root = page.locator('[data-source="pipeline-export"]')
    const trechos = page.locator('[data-testid="pe-reader-trechos"]')
    const pane = page.locator('[data-testid="pe-reader-pane"]')

    await expect(root).toHaveAttribute('data-work-count', '99')
    await expect(root).toHaveAttribute('data-loaded-count', '5')

    // full-work overview = 99 metadata rows; exactly 5 marked loaded, 94 not loaded
    await expect(trechos.locator('[data-prefix]')).toHaveCount(99)
    await expect(trechos.locator('[data-loaded="true"]')).toHaveCount(5)
    await expect(trechos.locator('[data-loaded="false"]')).toHaveCount(94)

    // default pane = current loaded segment (008), prose rendered
    await expect(pane).toHaveAttribute('data-selected', '00-01-002-008')
    await expect(pane).toHaveAttribute('data-loaded', 'true')
    await expect(
      page.getByText('na simples enunciação da palavra ser', { exact: false })
    ).toBeVisible()

    // prev/next within the loaded window: 008 -> 009, no navigation
    await page
      .locator('[data-testid="pe-reader-nav"]')
      .getByRole('button', { name: /Próximo trecho/ })
      .click()
    await expect(pane).toHaveAttribute('data-selected', '00-01-002-009')
    await expect(pane).toHaveAttribute('data-loaded', 'true')
    await expect(pane.locator('.pe-reader__prose')).toHaveCount(1)
    expect(page.url()).toBe(url)

    // select an UNLOADED segment from the overview: pane shows the not-loaded notice, NO prose, no import
    await trechos.locator('[data-prefix="00-01-002-011"]').click()
    await expect(pane).toHaveAttribute('data-selected', '00-01-002-011')
    await expect(pane).toHaveAttribute('data-loaded', 'false')
    await expect(page.locator('[data-testid="pe-reader-notice"]')).toBeVisible()
    await expect(pane.locator('.pe-reader__prose')).toHaveCount(0)
    expect(page.url()).toBe(url)

    // back to a loaded segment: prose returns
    await trechos.locator('[data-prefix="00-01-002-010"]').click()
    await expect(pane).toHaveAttribute('data-loaded', 'true')
    await expect(pane.locator('.pe-reader__prose')).toHaveCount(1)

    // the component renders no anchors (draft routePaths are never links)
    await expect(root.locator('a')).toHaveCount(0)
  })
})
