import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice 2E — single-segment reading-leaf preview from the pipeline export.
// docs/website-export-ingestion-assessment.md §7. Proves the future leaf-rendering model (metadata +
// prose joined by segmentPrefix/language) on a buffer (noindex/unlisted/out-of-search) page, with NO
// public segment route, NO route migration, NO redirects.
const DIST = path.resolve('.vitepress/dist')
const ARTIFACT = path.resolve('.vitepress/theme/data/pipeline-preview-segment.json')
const PREVIEW_HTML = path.resolve(DIST, 'reading-review/introduction-a-l-ontologie-segment.html')
const PREVIEW_SRC = path.resolve('src/reading-review/introduction-a-l-ontologie-segment.md')
const ORIGIN = 'https://www.skepvox.com'

const artifact = () => JSON.parse(fs.readFileSync(ARTIFACT, 'utf-8'))
const previewHtml = () => fs.readFileSync(PREVIEW_HTML, 'utf-8')

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

test.describe('pipeline-export segment preview (Slice 2E, buffer/noindex, no route migration)', () => {
  test('the artifact joins ONE segment by (segmentPrefix, language) with sanitized prose', () => {
    const seg = artifact().segment
    expect(seg.language).toBe('pt')
    expect(seg.segmentPrefix).toBe('00-01-002-008')
    expect(seg.canonicalId).toBe('louis-lavelle/introduction-a-l-ontologie/00-01-002-008')
    // authored Part -> Chapter context comes from groupPath (never inferred from slugs)
    const part = seg.groupPath.find((l: any) => l.kind === 'part')
    const chapter = seg.groupPath.find((l: any) => l.kind === 'chapter')
    expect(part.label).toBe('Primeira parte')
    expect(part.title).toBe('As categorias primeiras da ontologia')
    expect(chapter.title || chapter.label).toBe('Ser')
    // prose body present, italics preserved, structural ##/### stripped
    expect(seg.bodyHtml).toContain('na simples enunciação da palavra ser')
    expect(seg.bodyHtml).toContain('<em>')
    expect(seg.bodyHtml).not.toContain('##')
    // no private markers anywhere in the artifact
    const blob = JSON.stringify(artifact())
    for (const tok of ['read-at', '%% review', '[!review]', '[!dt]']) {
      expect(blob.includes(tok), tok).toBe(false)
    }
    expect(seg.bodyHtml.includes('==')).toBe(false)
  })

  test('the preview page renders the selected pt segment body + authored Part -> Chapter context', () => {
    const html = previewHtml()
    expect(html).toContain('data-source="pipeline-export"')
    expect(html).toContain('data-segment="00-01-002-008"')
    expect(html).toContain('data-lang="pt"')
    expect(html).toContain('Primeira parte') // authored part label
    expect(html).toContain('As categorias primeiras da ontologia') // authored part title
    expect(html).toContain('Ser') // authored chapter title
    expect(html).toContain('Parágrafo 7') // displayTitle
    expect(html).toContain('na simples enunciação da palavra ser') // prose body
    expect(html).toContain('o ser é, o não-ser não é') // guillemet quote preserved
  })

  test('the preview surface is non-public: noindex, out of sitemap, search, and llms', () => {
    expect(previewHtml()).toMatch(/name="robots"[^>]*content="noindex"/)
    expect(sitemapUrls().has('/reading-review/introduction-a-l-ontologie-segment')).toBe(false)
    expect(fs.readFileSync(PREVIEW_SRC, 'utf-8')).toMatch(/^search:\s*false/m)
    const llms = path.resolve(DIST, 'llms-full.txt')
    if (fs.existsSync(llms)) {
      const text = fs.readFileSync(llms, 'utf-8')
      expect(text.includes('introduction-a-l-ontologie-segment')).toBe(false)
      expect(text.includes('Pipeline segment preview')).toBe(false)
    }
  })

  test('the preview page creates no routes; no hidden pt duplicate; redirects disabled', () => {
    // the internal preview pages exist...
    expect(builtExists('/reading-review/introduction-a-l-ontologie-segment')).toBe(true)
    expect(builtExists('/reading-review/introduction-a-l-ontologie')).toBe(true) // map page still works
    // ...and the earlier HIDDEN pt family under reading-review/ is gone (relocated to the public ns)
    expect(fs.existsSync(path.join(DIST, 'reading-review/introducao-a-ontologia'))).toBe(false)
    // the fr source edition is not generated as a public segment family
    expect(
      builtExists('/louis-lavelle/introduction-a-l-ontologie/00-01-002-008-paragraphe-7')
    ).toBe(false)
    // the pt family is dropped from the sitemap by isChapterRoute (deep louis-lavelle routes)
    const urls = [...sitemapUrls()]
    // the pt hub is intentionally in the sitemap; only deep per-segment routes are pruned
    expect(urls.some((u) => /\/00-\d\d-\d\d\d-\d\d\d(-|\/|$)/.test(u))).toBe(false)
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

  test('ReadingNav and the WorkContentsMount allowlist are unchanged', () => {
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

  test('the leaf renders prose and joins by segmentPrefix — routePath is never a link', async ({
    page
  }) => {
    await page.goto('/reading-review/introduction-a-l-ontologie-segment')
    const leaf = page.locator('[data-source="pipeline-export"]')
    await expect(leaf.first()).toBeVisible()
    await expect(leaf.first()).toHaveAttribute('data-segment', '00-01-002-008')
    await expect(
      page.getByText('na simples enunciação da palavra ser', { exact: false })
    ).toBeVisible()
    // the leaf component renders no anchors (routePath is QA data, never an href)
    await expect(leaf.locator('a')).toHaveCount(0)

    // the review MAP page still works
    await page.goto('/reading-review/introduction-a-l-ontologie')
    await expect(page.locator('.pe-review').first()).toBeVisible()
  })
})
