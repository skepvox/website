import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { BRAS_WORK_ID, workSegments } from './pipeline-helpers'

// Brás Cubas editorial reading-divisions — the flat 160-chapter hub now reads in the SAME calm book-map
// grammar as Lavelle (divider → chapter rows), grouped under named EDITORIAL divisions instead of one
// generic "Capítulos" list. These are a render/navigation aid, NOT authored Parts (Machado wrote none):
// the component renders them from the work record's `readingDivisions` (authored:false), never from
// groupPath, and never mints a Part. Compact, high-value: the Brás-Cubas-specific surface + the guard
// that Lavelle's authored Parts are untouched. (Generic ingestion/route/metadata invariants live in the
// existing pipeline-export / pipeline-work-hub / pipeline-work-contents specs.)
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const COMPONENT = path.resolve('.vitepress/theme/components/PipelineWorkContents.vue')
const BRAS_HUB = '/pt/literatura/machado-de-assis/bras-cubas/'
const LAVELLE_HUB = '/pt/filosofia/louis-lavelle/introducao-a-ontologia/'
const BRAS_HUB_HTML = path.resolve(DIST, 'pt/literatura/machado-de-assis/bras-cubas/index.html')

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const brasPt = () => workSegments(read(META).segments, BRAS_WORK_ID, 'pt')

function builtExists(href: string): boolean {
  if (href.endsWith('/')) return fs.existsSync(path.join(DIST, href, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${href}.html`)) ||
    fs.existsSync(path.join(DIST, href, 'index.html'))
  )
}

// Anchors into the deep Brás Cubas pt leaves (chapter rows + the front-matter loose links).
function brasLinks(html: string): string[] {
  const re = /href="(\/pt\/literatura\/machado-de-assis\/bras-cubas\/[^"]+)"/g
  return [...new Set([...html.matchAll(re)].map((m) => m[1]))]
}

test.describe('Brás Cubas hub — editorial reading divisions', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('skepvox-consent', 'denied')
      } catch {
        /* storage unavailable */
      }
    })
  })

  test('renders 10 editorial division dividers + one quiet map note — NOT one generic "Capítulos" list', async ({
    page
  }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(BRAS_HUB)
    const nav = page.locator('nav.pwc')
    await expect(nav).toBeVisible()

    // named editorial dividers (the work declares 10), sitting where Lavelle's Part dividers sit
    await expect(nav.locator('.pwc__division-heading')).toHaveCount(10)
    await expect(nav.locator('.pwc__division-heading').first()).toHaveText('O Defunto Autor')
    await expect(nav.locator('.pwc__division-heading').last()).toHaveText('O Acerto de Contas')

    // the OLD generic flat group is gone: no editorial "Capítulos" heading, no flat-fallback section
    await expect(nav.locator('.pwc__opening-heading', { hasText: 'Capítulos' })).toHaveCount(0)
    await expect(nav.locator('.pwc__part--editorial')).toHaveCount(0)

    // exactly one quiet caption marks the map as editorial (not the author's), never a per-divider badge
    const note = page.locator('.pwc__map-note')
    await expect(note).toHaveCount(1)
    await expect(note).toContainText(/agrupamento editorial/i)

    // Abertura (front matter) stays its own separate group, above the divisions
    await expect(nav.locator('.pwc__opening-heading', { hasText: 'Abertura' })).toHaveCount(1)
    await expect(nav.locator('.pwc__link--loose')).toHaveCount(3) // Dedicatória / Prólogo / Ao leitor

    expect(errors).toEqual([]) // SSR/hydration did not throw
  })

  test('all 160 chapters are grouped UNDER divisions, and every chapter link resolves', async ({
    page
  }) => {
    await page.goto(BRAS_HUB)
    const nav = page.locator('nav.pwc')
    // every chapter row lives inside a division section — none stranded in a bare list
    await expect(nav.locator('a.pwc__chapter-row')).toHaveCount(160)
    await expect(nav.locator('.pwc__part--division a.pwc__chapter-row')).toHaveCount(160)

    // built-HTML: the 160 chapter routes + 3 front-matter routes are exactly the 163 pt leaves, all built
    const html = fs.readFileSync(BRAS_HUB_HTML, 'utf-8')
    const links = brasLinks(html)
    const routes = brasPt()
      .map((s: any) => `/${s.routePath}`)
      .sort()
    expect([...links].sort()).toEqual(routes)
    expect(links.length).toBe(163)
    const bodyRoutes = brasPt().filter((s: any) => s.groupPath.length > 0)
    expect(bodyRoutes.length).toBe(160)
    for (const l of links) expect(builtExists(l), l).toBe(true)
  })

  test('route hygiene: prefix-only bare leaves, no legacy /literatura/ leak, no slug tail', () => {
    const html = fs.readFileSync(BRAS_HUB_HTML, 'utf-8')
    // the retired hand-authored corpus lived at /literatura/... (no /pt prefix) — it must not return
    expect(html.includes('href="/literatura/')).toBe(false)
    // every chapter link is the bare segmentPrefix leaf (prefix-only) — no display-slug tail
    for (const l of brasLinks(html))
      expect(l, l).toMatch(
        /\/pt\/literatura\/machado-de-assis\/bras-cubas\/\d\d-\d\d-\d\d\d-\d\d\d$/
      )
  })

  test('the hub is metadata-only — no concatenated prose, no all-prose import', () => {
    const html = fs.readFileSync(BRAS_HUB_HTML, 'utf-8')
    // a distinctive ch.1 BODY sentence must never appear on the metadata-only hub
    expect(html.includes('Algum tempo hesitei se devia abrir estas memórias')).toBe(false)
    // the component reads ONLY the metadata segments artifact (no prose import)
    const src = fs.readFileSync(COMPONENT, 'utf-8')
    expect(src.includes("import meta from '../data/pipeline-export-segments.json'")).toBe(true)
    expect(/import\s+\w+\s+from\s+['"][^'"]*prose/.test(src)).toBe(false)
    // readingDivisions is a WORK-record field, never a per-segment field
    const seg = (read(META).segments as Record<string, unknown>[])[0]
    expect('readingDivisions' in seg).toBe(false)
  })

  test('Lavelle hub is unchanged: authored Part dividers, NOT editorial divisions', async ({
    page
  }) => {
    await page.goto(LAVELLE_HUB)
    const nav = page.locator('nav.pwc')
    await expect(nav.locator('.pwc__part-heading')).toHaveCount(2) // the two authored Parts
    await expect(nav.locator('.pwc__division-heading')).toHaveCount(0) // never editorialised
    await expect(page.locator('.pwc__map-note')).toHaveCount(0) // no editorial note on an authored work
  })
})
