import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice 2C — review-only consumer of the vendored pipeline export.
// docs/website-export-ingestion-assessment.md §7 (option C, internal/noindex). Proves the website
// can consume pipeline-export-segments.json through the UI on a buffer (noindex/unlisted/out-of-
// search) page, with NO public route migration, NO new public pages, NO indexing of draft segments.
const DIST = path.resolve('.vitepress/dist')
const ARTIFACT = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const REVIEW_HTML = path.resolve(DIST, 'reading-review/introduction-a-l-ontologie.html')
const REVIEW_SRC = path.resolve('src/reading-review/introduction-a-l-ontologie.md')
const ORIGIN = 'https://www.skepvox.com'

const artifact = () => JSON.parse(fs.readFileSync(ARTIFACT, 'utf-8'))
const reviewHtml = () => fs.readFileSync(REVIEW_HTML, 'utf-8')

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

test.describe('pipeline-export review consumer (Slice 2C/2D, buffer/noindex, no route migration)', () => {
  test('the default (pt) edition renders authored Part -> Chapter from source:"pipeline-export"', () => {
    const html = reviewHtml()
    expect(html).toContain('data-source="pipeline-export"')
    expect(html).toContain('data-active="pt"') // default = canonical reading edition
    // default edition (pt) authored groupPath (inferred:false): labels + titles, not synthesized "Parte 1"
    expect(html).toContain('Primeira parte')
    expect(html).toContain('As categorias primeiras da ontologia')
    expect(html).toContain('Ser') // pt chapter title
    // both language buttons are present; the fr edition renders client-side on switch
    expect(html).toContain('Português')
    expect(html).toContain('Français')
  })

  test('the compare/QA block reports 99/99/99, matched canonicalIds, and the minted pt state', () => {
    const html = reviewHtml()
    // tolerant of Vue's scoped data-v-* attribute between the attr and ">"
    expect(html).toMatch(/data-qa="canonical"[^>]*>\s*99\s*</)
    expect(html).toMatch(/data-qa="fr"[^>]*>\s*99\s*</)
    expect(html).toMatch(/data-qa="pt"[^>]*>\s*99\s*</)
    expect(html).toMatch(/data-qa="ids-match"[^>]*>\s*matched/)
    // the pt canonical edition has been minted: routeStability rolls up to stable; maturity is still draft
    expect(html).toMatch(/data-qa="route-stability"[^>]*>\s*stable\s*</)
    expect(html).toMatch(/data-qa="maturity"[^>]*>\s*draft\s*</)
  })

  test('99 fr + 99 pt records; the pt public family is built and the hidden review family is gone', () => {
    const segs = artifact().segments
    expect(segs.filter((s: any) => s.language === 'fr').length).toBe(99)
    expect(segs.filter((s: any) => s.language === 'pt').length).toBe(99)
    // the minted pt family is now built at its PUBLIC namespace...
    expect(builtExists('/louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7')).toBe(
      true
    )
    // ...and the earlier HIDDEN duplicate under reading-review/ is gone (no duplicate route family)
    expect(fs.existsSync(path.join(DIST, 'reading-review/introducao-a-ontologia'))).toBe(false)
    // the fr source edition is NOT generated as a public segment family (only its 12 chapter pages)
    expect(
      builtExists('/louis-lavelle/introduction-a-l-ontologie/00-01-002-008-paragraphe-7')
    ).toBe(false)
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

  test('the review surface is non-public: noindex, out of sitemap, out of search, out of llms', () => {
    // robots noindex on the built page
    expect(reviewHtml()).toMatch(/name="robots"[^>]*content="noindex"/)
    // excluded from the sitemap (buffer:true)
    const urls = sitemapUrls()
    expect(urls.has('/reading-review/introduction-a-l-ontologie')).toBe(false)
    // out of local search (search:false frontmatter)
    expect(fs.readFileSync(REVIEW_SRC, 'utf-8')).toMatch(/^search:\s*false/m)
    // out of the LLM output (ignoreFiles 'reading-review/**')
    const llms = path.resolve(DIST, 'llms-full.txt')
    if (fs.existsSync(llms)) {
      const text = fs.readFileSync(llms, 'utf-8')
      expect(text.includes('reading-review/introduction-a-l-ontologie')).toBe(false)
      expect(text.includes('Pipeline export review')).toBe(false)
    }
  })

  test('no draft pipeline routePath leaks into the sitemap', () => {
    const urls = [...sitemapUrls()]
    expect(urls.some((u) => u.includes('introducao-a-ontologia'))).toBe(false)
    expect(urls.some((u) => /\/00-\d\d-\d\d\d-\d\d\d-/.test(u))).toBe(false) // 4-group segment prefixes
  })

  test('segment-manifest consumers and the WorkContentsMount allowlist are unchanged', () => {
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

  test('WorkContents still renders on de-l-acte and Brás Cubas; the review page uses a separate consumer', async ({
    page
  }) => {
    await page.goto('/louis-lavelle/de-l-acte')
    await expect(page.locator('.work-contents').first()).toBeVisible()

    await page.goto('/literatura/machado-de-assis/bras-cubas')
    await expect(page.locator('.work-contents').first()).toBeVisible()

    await page.goto('/reading-review/introduction-a-l-ontologie')
    await expect(page.locator('[data-source="pipeline-export"]').first()).toBeVisible()
    await expect(page.locator('.work-contents')).toHaveCount(0) // WorkContents is NOT mounted here
  })

  test('language switcher: default pt; switching to fr updates content with no navigation; routePath is never a link', async ({
    page
  }) => {
    await page.goto('/reading-review/introduction-a-l-ontologie')
    const url = page.url()
    const switcher = page.locator('[data-testid="pe-lang-switch"]')
    const pt = switcher.getByRole('button', { name: 'Português' })
    const fr = switcher.getByRole('button', { name: 'Français' })

    // default = Português (canonical reading edition)
    await expect(pt).toHaveAttribute('aria-pressed', 'true')
    await expect(fr).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByText('Primeira parte', { exact: false }).first()).toBeVisible()

    // switch to Français — content updates client-side, no navigation
    await fr.click()
    await expect(fr).toHaveAttribute('aria-pressed', 'true')
    await expect(pt).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByText('Première partie', { exact: false }).first()).toBeVisible()
    await expect(
      page.getByText('Les catégories premières de', { exact: false }).first()
    ).toBeVisible()
    await expect(page.getByText('Être', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('Primeira parte', { exact: false })).toHaveCount(0)
    expect(page.url()).toBe(url) // no URL/navigation change

    // routePath is shown only as QA data: the review component itself renders NO anchors
    // (the page H1's header-anchor permalink is VitePress chrome, outside the component).
    await expect(page.locator('[data-testid="pe-routepaths"]')).toHaveCount(1)
    await expect(page.locator('[data-source="pipeline-export"] a')).toHaveCount(0)
  })
})
