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

test.describe('pipeline-export review consumer (Slice 2C, buffer/noindex, no route migration)', () => {
  test('the review page renders the authored Part -> Chapter structure from source:"pipeline-export"', () => {
    const html = reviewHtml()
    expect(html).toContain('data-source="pipeline-export"')
    // authored groupPath (inferred:false), fr edition — labels + titles, not synthesized "Partie 1"
    expect(html).toContain('Première partie')
    expect(html).toContain('Les catégories premières de') // authored part title (apostrophe-escape agnostic)
    expect(html).toContain('Deuxième partie')
    expect(html).toContain('Être') // fr chapter title
    // pt edition is rendered too
    expect(html).toContain('Primeira parte')
    expect(html).toContain('As categorias primeiras da ontologia')
    expect(html).toContain('Ser') // pt chapter title
  })

  test('99 fr + 99 pt records are available, but no 198 public pages are generated', () => {
    const segs = artifact().segments
    expect(segs.filter((s: any) => s.language === 'fr').length).toBe(99)
    expect(segs.filter((s: any) => s.language === 'pt').length).toBe(99)
    // the localized pt route family does not exist as built pages
    expect(fs.existsSync(path.join(DIST, 'louis-lavelle/introducao-a-ontologia'))).toBe(false)
    // sample segment routePaths (fr + pt) are NOT built into pages
    expect(
      builtExists('/louis-lavelle/introduction-a-l-ontologie/00-01-002-008-paragraphe-7')
    ).toBe(false)
    expect(builtExists('/louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7')).toBe(
      false
    )
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
    await expect(page.getByText('Première partie', { exact: false }).first()).toBeVisible()
  })
})
