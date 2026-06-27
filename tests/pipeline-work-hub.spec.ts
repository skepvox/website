import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { LAVELLE_WORK_ID, workSegments } from './pipeline-helpers'

// Slice 2N (go-live) + owned reader-shell proof slice — the pt work hub at
// /pt/filosofia/louis-lavelle/introducao-a-ontologia/. A readable entry point built from pipeline-export metadata
// (never the legacy hand-authored map): the hub markdown is frontmatter-only; the title and contents
// (front matter, then Part -> Chapter -> Segment) are rendered together by the owned SSR component
// PipelineWorkContents, which reads the same pipeline-export metadata. No concatenated prose, no
// markdown bullet list or stranded H1. Indexable; in the sitemap; deep segment routes pruned.
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const HUB_SRC = path.resolve('src/pt/filosofia/louis-lavelle/introducao-a-ontologia/index.md')
const HUB_HTML = path.resolve(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/index.html')
const ORIGIN = 'https://www.skepvox.com'
const NS = '/pt/filosofia/louis-lavelle/introducao-a-ontologia/'

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const ptSegments = () => workSegments(read(META).segments, LAVELLE_WORK_ID, 'pt')

function builtExists(href: string): boolean {
  if (href.endsWith('/')) return fs.existsSync(path.join(DIST, href, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${href}.html`)) ||
    fs.existsSync(path.join(DIST, href, 'index.html'))
  )
}

// Anchors that point at a deep pt segment route (one path segment below the work namespace). On the
// hub these come exclusively from the owned PipelineWorkContents component (the hub has no sidebar,
// no leaf nav, and no markdown link list).
function segmentLinks(html: string): string[] {
  const re = /href="(\/pt\/filosofia\/louis-lavelle\/introducao-a-ontologia\/[^"]+)"/g
  return [...new Set([...html.matchAll(re)].map((m) => m[1]))]
}

const sitemapUrls = () =>
  new Set(
    [
      ...fs
        .readFileSync(path.resolve(DIST, 'sitemap.xml'), 'utf-8')
        .matchAll(/<loc>([^<]+)<\/loc>/g)
    ].map((m) => m[1].replace(ORIGIN, ''))
  )

test.describe('pipeline pt work hub (Slice 2N + owned reader-shell proof slice)', () => {
  test('the hub builds at the pt namespace and is generated from pipeline-export (not the legacy map)', () => {
    expect(builtExists('/pt/filosofia/louis-lavelle/introducao-a-ontologia')).toBe(true)
    const src = fs.readFileSync(HUB_SRC, 'utf-8')
    expect(src).toContain('generated: pipeline-work-hub')
    // the legacy hand-authored manifest is never the hub's source
    expect(src.includes('segment' + '-manifest')).toBe(false)
  })

  test('the owned PipelineWorkContents component renders the title and contents (no markdown body)', () => {
    const src = fs.readFileSync(HUB_SRC, 'utf-8')
    // the hub markdown is frontmatter-only — title and contents are owned by PipelineWorkContents.
    expect(src).not.toContain('# Introdução à ontologia')
    expect(src).not.toMatch(/\]\(\/pt\/filosofia\/louis-lavelle\/introducao-a-ontologia\//)
    expect(src).not.toMatch(/^\s*-\s+\[/m)

    const html = fs.readFileSync(HUB_HTML, 'utf-8')
    // the owned component is present (SSR'd into the static page) ...
    expect(html).toContain('class="pwc__title"')
    expect(html).toContain('class="pwc"')
    expect(html).toContain('aria-label="Sumário"')
    expect(html.indexOf('class="pwc__title"')).toBeLessThan(html.indexOf('class="pwc"'))
    // ... and the contents are NOT a rented vt-doc <ul><li> document list
    expect(html).not.toMatch(
      /<li[^>]*>\s*<a [^>]*href="\/pt\/filosofia\/louis-lavelle\/introducao-a-ontologia\//
    )
  })

  test('the rented VPContentDocFooter pager is gone (footer: false)', () => {
    const html = fs.readFileSync(HUB_HTML, 'utf-8')
    expect(html).not.toContain('VPContentDocFooter')
    // the specific old leak: a "next" pager link into a different Lavelle work
    expect(html).not.toMatch(/class="[^"]*next-link[^"]*"[\s\S]*?\/louis-lavelle\/de-l-etre/)
  })

  test('the component renders the full 99-segment pt family (and only pt routes); links resolve', () => {
    const html = fs.readFileSync(HUB_HTML, 'utf-8')
    const links = segmentLinks(html)
    const ptRoutes = ptSegments()
      .map((s: any) => `/${s.routePath}`)
      .sort()
    expect([...links].sort()).toEqual(ptRoutes)
    expect(links.length).toBe(99)
    // links use routePath (presentation); none uses the canonicalId / source fr bookSlug path
    expect(links.some((l) => l.includes('introduction-a-l-ontologie'))).toBe(false)
    // every linked target is a built pt page
    for (const l of links) expect(builtExists(l), l).toBe(true)
  })

  test('no fr old-chapter links and no reading-review surfaces leak onto the hub', () => {
    const html = fs.readFileSync(HUB_HTML, 'utf-8')
    expect(html.includes('/louis-lavelle/introduction-a-l-ontologie/')).toBe(false)
    expect(html.includes('/reading-review/')).toBe(false)
  })

  test('the hub carries metadata/links only — no concatenated prose body', () => {
    const src = fs.readFileSync(HUB_SRC, 'utf-8')
    const html = fs.readFileSync(HUB_HTML, 'utf-8')
    expect(src).not.toContain('Escolha um trecho para começar a leitura.')
    // distinctive prose phrases from segments must NOT appear on the hub (src or rendered HTML)
    for (const phrase of ['na simples enunciação da palavra ser', 'o ser é, o não-ser não é']) {
      expect(src.includes(phrase)).toBe(false)
      expect(html.includes(phrase)).toBe(false)
    }
  })

  test('the hub is indexable and present in the sitemap; pt segments are crawlable but sitemap-pruned', () => {
    const html = fs.readFileSync(HUB_HTML, 'utf-8')
    expect(html).not.toMatch(/name="robots"[^>]*content="noindex"/)
    const urls = [...sitemapUrls()]
    // VitePress emits the dir-index hub with a trailing slash; accept either form
    expect(
      urls.some(
        (u) => u.replace(/\/$/, '') === '/pt/filosofia/louis-lavelle/introducao-a-ontologia'
      )
    ).toBe(true)
    // deep pt segment routes are dropped from the sitemap by isChapterRoute (discoverable via the hub)
    expect([...urls].some((u) => u.startsWith(NS) && /\/00-|\/99-/.test(u))).toBe(false)
    // reading-review demo surfaces remain out of the sitemap
    expect([...urls].some((u) => u.startsWith('/reading-review/'))).toBe(false)
  })
})
