import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice 2F — multi-segment reading-flow preview from the pipeline export.
// docs/website-export-ingestion-assessment.md §7. A small contiguous window of pt segments rendered
// one trecho at a time (prev/next + "Trechos" zoom-out) on a buffer (noindex/unlisted/out-of-search)
// page — joined by (segmentPrefix, language), never routePath. NO public segment route, NO migration.
const DIST = path.resolve('.vitepress/dist')
const ARTIFACT = path.resolve('.vitepress/theme/data/pipeline-preview-window.json')
const PAGE_HTML = path.resolve(DIST, 'reading-review/introduction-a-l-ontologie-window.html')
const PAGE_SRC = path.resolve('src/reading-review/introduction-a-l-ontologie-window.md')
const ORIGIN = 'https://www.skepvox.com'

const artifact = () => JSON.parse(fs.readFileSync(ARTIFACT, 'utf-8'))
const pageHtml = () => fs.readFileSync(PAGE_HTML, 'utf-8')

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

test.describe('pipeline-export reading-flow preview (Slice 2F, buffer/noindex, no route migration)', () => {
  test('the window artifact holds a contiguous pt window joined by (segmentPrefix, language)', () => {
    const a = artifact()
    expect(a.current).toBe('00-01-002-008')
    const segs = a.segments
    expect(segs.length).toBe(5)
    expect(segs.map((s: any) => s.order)).toEqual([6, 7, 8, 9, 10])
    expect(segs.map((s: any) => s.segmentPrefix)).toEqual([
      '00-01-001-006',
      '00-01-001-007',
      '00-01-002-008',
      '00-01-002-009',
      '00-01-002-010'
    ])
    expect(segs.every((s: any) => s.language === 'pt')).toBe(true)
    // sanitized prose: italics kept somewhere, headings stripped, no private markers
    expect(segs.some((s: any) => s.bodyHtml.includes('<em>'))).toBe(true)
    expect(segs.every((s: any) => !s.bodyHtml.includes('##'))).toBe(true)
    const blob = JSON.stringify(a)
    for (const tok of ['read-at', '%% review', '[!review]', '[!dt]']) {
      expect(blob.includes(tok), tok).toBe(false)
    }
    expect(segs.every((s: any) => !s.bodyHtml.includes('=='))).toBe(true)
  })

  test('the buffer page is non-public: noindex, out of sitemap, search, and llms', () => {
    expect(pageHtml()).toMatch(/name="robots"[^>]*content="noindex"/)
    expect(sitemapUrls().has('/reading-review/introduction-a-l-ontologie-window')).toBe(false)
    expect(fs.readFileSync(PAGE_SRC, 'utf-8')).toMatch(/^search:\s*false/m)
    const llms = path.resolve(DIST, 'llms-full.txt')
    if (fs.existsSync(llms)) {
      const text = fs.readFileSync(llms, 'utf-8')
      expect(text.includes('introduction-a-l-ontologie-window')).toBe(false)
      expect(text.includes('Pipeline reading-flow preview')).toBe(false)
    }
  })

  test('no public segment routes / redirects are created', () => {
    expect(builtExists('/reading-review/introduction-a-l-ontologie-window')).toBe(true)
    // the earlier review surfaces still build
    expect(builtExists('/reading-review/introduction-a-l-ontologie')).toBe(true)
    expect(builtExists('/reading-review/introduction-a-l-ontologie-segment')).toBe(true)
    expect(fs.existsSync(path.join(DIST, 'louis-lavelle/introducao-a-ontologia'))).toBe(false)
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

  test('prev/next and the Trechos overview move between segments with no navigation; no routePath link', async ({
    page
  }) => {
    await page.goto('/reading-review/introduction-a-l-ontologie-window')
    const url = page.url()
    const leaf = page.locator('[data-source="pipeline-export"]')
    const nav = page.locator('[data-testid="pe-flow-nav"]')
    const trechos = page.locator('[data-testid="pe-trechos"]')

    // defaults to the current segment (00-01-002-008 / "Parágrafo 7")
    await expect(leaf).toHaveAttribute('data-segment', '00-01-002-008')
    await expect(
      page.getByText('na simples enunciação da palavra ser', { exact: false })
    ).toBeVisible()
    // overview highlights the current trecho
    await expect(trechos.locator('[aria-current="true"]')).toHaveText(/Parágrafo 7/)

    // Próximo trecho -> 009, no navigation
    await nav.getByRole('button', { name: /Próximo trecho/ }).click()
    await expect(leaf).toHaveAttribute('data-segment', '00-01-002-009')
    await expect(page.locator('.pe-flow__title')).toHaveText('Parágrafo 8')
    await expect(trechos.locator('[aria-current="true"]')).toHaveText(/Parágrafo 8/)
    expect(page.url()).toBe(url)

    // Trecho anterior twice -> 007 (crosses back into the Distinção chapter)
    await nav.getByRole('button', { name: /Trecho anterior/ }).click()
    await nav.getByRole('button', { name: /Trecho anterior/ }).click()
    await expect(leaf).toHaveAttribute('data-segment', '00-01-001-007')
    await expect(page.locator('.pe-flow__title')).toHaveText('Parágrafo 6')

    // jump via the overview -> 010 (Parágrafo 9)
    await trechos.getByRole('button', { name: /Parágrafo 9/ }).click()
    await expect(leaf).toHaveAttribute('data-segment', '00-01-002-010')
    expect(page.url()).toBe(url)

    // the component renders no anchors (routePath is QA data, never a link)
    await expect(leaf.locator('a')).toHaveCount(0)
  })
})
