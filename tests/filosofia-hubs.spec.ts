import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice A3 / IA-3 — the locale-rooted filosofia navigation layer around the already-moved book:
// section hub /pt/filosofia/ and author hub /pt/filosofia/louis-lavelle/, both SSR CardGrid hubs.
// The Introdução work card is sourced from pipeline-export metadata (never works.json); the work hub
// + 99 segment leaves are unchanged. File-based against the built site (needs a prior build); the
// pipeline component is tested through its built HTML, the codebase convention.
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const ORIGIN = 'https://www.skepvox.com'
const SECTION = '/pt/filosofia/'
const AUTHOR = '/pt/filosofia/louis-lavelle/'
const WORK_HUB = '/pt/filosofia/louis-lavelle/introducao-a-ontologia/'

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const html = (route: string) =>
  fs.readFileSync(
    route.endsWith('/') ? path.join(DIST, route, 'index.html') : path.join(DIST, `${route}.html`),
    'utf-8'
  )

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
      ...fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8').matchAll(/<loc>([^<]+)<\/loc>/g)
    ].map((m) => m[1].replace(ORIGIN, ''))
  )

test.describe('filosofia hubs (slice A3 / IA-3)', () => {
  test('the Introdução work card is pipeline-sourced: rendered route + title match the export, no works.json', () => {
    const meta = read(META)
    const work = meta.works.find(
      (w: any) => w.workId === 'louis-lavelle/introduction-a-l-ontologie'
    )
    const pt = work.editions.find((e: any) => e.language === 'pt')
    const expectedHref = `/${pt.routePrefix}/`
    expect(expectedHref).toBe(WORK_HUB)
    // the rendered work card on the author hub is built from pipeline metadata (work.title + pt routePrefix)
    const h = html(AUTHOR)
    expect(h).toContain(`href="${expectedHref}"`)
    expect(h).toContain(work.title) // "Introdução à ontologia"
    expect(h).toContain(`${pt.segmentCount} trechos`) // meta line derived from segmentCount
    // the helper reads the pipeline export and never a works.json (no reintroduction for the moved book)
    const src = fs.readFileSync(
      path.resolve('.vitepress/theme/components/filosofia-cards.ts'),
      'utf-8'
    )
    expect(src).toContain("import meta from '../data/pipeline-export-segments.json'")
    expect(src).toContain('routePrefix') // href derived from the pt edition routePrefix
    expect(/from\s+['"][^'"]*works\.json['"]/.test(src)).toBe(false) // never IMPORTS a works.json
    // the author hub uses the pipeline helper, NOT a local works.json (unlike the literatura author hubs)
    const authorMd = fs.readFileSync(
      path.resolve('src/pt/filosofia/louis-lavelle/index.md'),
      'utf-8'
    )
    expect(authorMd).toContain('filosofiaWorkCards')
    expect(/from\s+['"][^'"]*works\.json['"]/.test(authorMd)).toBe(false)
  })

  test('the section hub /pt/filosofia/ builds and links to the Louis Lavelle author hub', () => {
    expect(builtExists(SECTION)).toBe(true)
    const h = html(SECTION)
    expect(h).toContain(`href="${AUTHOR}"`)
    expect(h).toContain('Louis Lavelle') // the author card
    expect(h).toContain(`<link rel="canonical" href="${ORIGIN}${SECTION}">`) // self-referential canonical
  })

  test('the author hub /pt/filosofia/louis-lavelle/ builds and links to the Introdução work hub', () => {
    expect(builtExists(AUTHOR)).toBe(true)
    const h = html(AUTHOR)
    expect(h).toContain(`href="${WORK_HUB}"`)
    expect(h).toContain('Introdução à ontologia') // displayed work title (the pipeline-sourced card)
    expect(h).toContain(`<link rel="canonical" href="${ORIGIN}${AUTHOR}">`)
    expect(h.includes('href="/louis-lavelle/introducao-a-ontologia')).toBe(false) // no old-route leak
  })

  test('the Introdução work hub stays locale-rooted and still mounts PipelineWorkContents', () => {
    expect(builtExists(WORK_HUB)).toBe(true)
    const h = html(WORK_HUB)
    expect(h).toContain('class="pwc-shell"') // PipelineWorkContents rendered
    expect(h).toContain('href="/pt/filosofia/louis-lavelle/introducao-a-ontologia/00-00-000-001"') // a segment link
    expect(builtExists('/louis-lavelle/introducao-a-ontologia/')).toBe(false) // old locale-less hub gone
  })

  test('every link from the new filosofia hubs resolves to a built page', () => {
    for (const hub of [SECTION, AUTHOR]) {
      const hrefs = [...html(hub).matchAll(/href="(\/pt\/filosofia\/[^"#]+)"/g)].map((m) => m[1])
      expect(hrefs.length, hub).toBeGreaterThan(0)
      for (const href of new Set(hrefs)) expect(builtExists(href), `${hub} -> ${href}`).toBe(true)
    }
  })

  test('no /louis-lavelle/introducao-a-ontologia link in the new hubs or generated nav/card data', () => {
    // href="/louis-lavelle/introducao-a-ontologia (the OLD route as a standalone href; the new
    // /pt/filosofia/louis-lavelle/introducao-a-ontologia/ contains it only as a substring).
    for (const hub of [SECTION, AUTHOR]) {
      expect(html(hub).includes('href="/louis-lavelle/introducao-a-ontologia'), hub).toBe(false)
    }
    // generated sidebar-nav data carries no link into the moved book's old namespace
    const sidebarNav = fs.readFileSync(
      path.resolve('.vitepress/theme/data/sidebar-nav.json'),
      'utf-8'
    )
    expect(sidebarNav.includes('/louis-lavelle/introducao-a-ontologia')).toBe(false)
    // the legacy /louis-lavelle/ hub + its works.json were removed entirely in A5 (clean break)
    expect(fs.existsSync(path.resolve('src/louis-lavelle/works.json'))).toBe(false)
    expect(fs.existsSync(path.resolve('src/louis-lavelle'))).toBe(false)
  })

  test('the new section + author hubs are in the sitemap; segment leaves crawlable but pruned', () => {
    const urls = sitemapUrls()
    expect(urls.has(SECTION)).toBe(true)
    expect(urls.has(AUTHOR)).toBe(true)
    expect(urls.has(WORK_HUB)).toBe(true) // the work hub stays indexable
    // ALL segment leaves are pruned, not just a sampled one: no depth-5 leaf under the work hub is in
    // the sitemap (the hub itself ends in '/', so the [^/]+$ shape excludes it). A regression that
    // dropped the `pipeline-segment-routes` marker on a subset of leaves would leak them here.
    const leaked = [...urls].filter((u) =>
      /^\/pt\/filosofia\/louis-lavelle\/introducao-a-ontologia\/[^/]+$/.test(u)
    )
    expect(leaked).toEqual([])
    // a representative leaf is still built + crawlable (not noindex)
    const leaf = '/pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008'
    expect(builtExists(leaf)).toBe(true)
    expect(html(leaf).includes("content: 'noindex'")).toBe(false)
  })

  test('the Filosofia nav entry stays; the legacy Lavelle nav was removed in A5', () => {
    const config = fs.readFileSync(path.resolve('.vitepress/config.ts'), 'utf-8')
    expect(config).toContain("activeMatch: '^/pt/filosofia/'")
    expect(config).toContain("link: '/pt/filosofia/'")
    expect(config.includes("activeMatch: '^/louis-lavelle/'")).toBe(false) // legacy nav removed in A5
  })

  test('isChapterRoute is marker-aware (no temporary pt/filosofia depth rule remains)', () => {
    const config = fs.readFileSync(path.resolve('.vitepress/config.ts'), 'utf-8')
    expect(config).toContain('pipelineSegmentRoutes.has(url)') // marker-set gate
    expect(config).toContain("frontmatter.generated === 'pipeline-segment-routes'") // collected by marker
    expect(/segments\[1\]\s*===\s*'filosofia'/.test(config)).toBe(false) // the temporary depth rule is gone
  })
})
