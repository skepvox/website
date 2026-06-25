import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice 2N (go-live) — the pt work hub at /louis-lavelle/introducao-a-ontologia/. A readable entry
// point built from pipeline-export metadata (never segment-manifest): authored Part -> Chapter ->
// Segment LINKS into the 99 pt route family, no concatenated prose. Indexable; in the sitemap.
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const HUB_SRC = path.resolve('src/louis-lavelle/introducao-a-ontologia/index.md')
const HUB_HTML = path.resolve(DIST, 'louis-lavelle/introducao-a-ontologia/index.html')
const ORIGIN = 'https://www.skepvox.com'

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const ptSegments = () => read(META).segments.filter((s: any) => s.language === 'pt')

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

test.describe('pipeline pt work hub (Slice 2N, public entry point)', () => {
  test('the hub builds at the pt namespace and is generated from pipeline-export (not segment-manifest)', () => {
    expect(builtExists('/louis-lavelle/introducao-a-ontologia')).toBe(true)
    const src = fs.readFileSync(HUB_SRC, 'utf-8')
    expect(src).toContain('generated: pipeline-work-hub')
    expect(src.includes('segment-manifest')).toBe(false)
  })

  test('the hub links to the full 99-segment pt family (and only pt routes); no canonicalId confusion', () => {
    const src = fs.readFileSync(HUB_SRC, 'utf-8')
    const links = [...src.matchAll(/\]\((\/louis-lavelle\/introducao-a-ontologia\/[^)]+)\)/g)].map(
      (m) => m[1]
    )
    // exactly the pt routePaths from pipeline-export, one link per segment
    const ptRoutes = ptSegments()
      .map((s: any) => `/${s.routePath}`)
      .sort()
    expect([...links].sort()).toEqual(ptRoutes)
    expect(links.length).toBe(99)
    // links use routePath (presentation); none uses the canonicalId/source bookSlug path
    expect(links.some((l) => l.includes('introduction-a-l-ontologie'))).toBe(false)
    // every linked target is a built page
    for (const l of links) expect(builtExists(l), l).toBe(true)
  })

  test('the hub does not concatenate the full book (links only, no prose body)', () => {
    const src = fs.readFileSync(HUB_SRC, 'utf-8')
    // a distinctive prose phrase from a segment must NOT appear on the hub
    expect(src.includes('na simples enunciação da palavra ser')).toBe(false)
    expect(src.includes('o ser é, o não-ser não é')).toBe(false)
  })

  test('the hub is indexable and present in the sitemap; pt segments are crawlable but sitemap-pruned', () => {
    const html = fs.readFileSync(HUB_HTML, 'utf-8')
    expect(html).not.toMatch(/name="robots"[^>]*content="noindex"/)
    const urls = [...sitemapUrls()]
    // VitePress emits the dir-index hub with a trailing slash; accept either form
    expect(urls.some((u) => u.replace(/\/$/, '') === '/louis-lavelle/introducao-a-ontologia')).toBe(
      true
    )
    // deep pt segment routes are dropped from the sitemap by isChapterRoute (discoverable via the hub)
    expect([...urls].some((u) => /\/introducao-a-ontologia\/00-/.test(u))).toBe(false)
    // reading-review demo surfaces remain out of the sitemap
    expect([...urls].some((u) => u.startsWith('/reading-review/'))).toBe(false)
  })
})
