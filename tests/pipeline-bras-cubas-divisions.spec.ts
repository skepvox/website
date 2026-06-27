import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { BRAS_WORK_ID, workSegments } from './pipeline-helpers'

// Brás Cubas editorial reading-divisions — the flat 160-chapter hub reads in the SAME map grammar
// as Lavelle: visible Abertura front matter, then a "Capítulos" divider, then COLLAPSIBLE sections
// (each a row with a count of the final reading units inside, expanding to reveal them). For Brás Cubas
// the sections are the 10 named reading divisions (count = chapter-segments); the chapter-segments are
// the revealed leaves, never a raw flat wall. These are a render/navigation aid, NOT authored Parts.
// Compact,
// high-value: the Brás-Cubas surface + the guard that Lavelle's authored grammar is untouched. (Generic
// ingestion/route/metadata invariants live in the pipeline-export / pipeline-work-hub specs.)
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

// All Brás Cubas deep pt leaves (revealed chapter-segments + the front-matter leaves).
function brasLinks(html: string): string[] {
  const re = /href="(\/pt\/literatura\/machado-de-assis\/bras-cubas\/[^"]+)"/g
  return [...new Set([...html.matchAll(re)].map((m) => m[1]))]
}

// The expected section rows (label + count of final reading units), derived from the DATA so the test
// tracks the declared scheme: each named reading division only. Abertura is visible front matter, not a
// collapsible section.
function expectedSections(): { label: string; count: number }[] {
  const work = read(META).works.find((w: any) => w.workId === BRAS_WORK_ID)
  const segs = brasPt()
  const body = segs.filter((s: any) => s.groupPath.length > 0)
  const sections = []
  for (const d of work.readingDivisions.divisions) {
    const a = body.findIndex((s: any) => s.segmentPrefix === d.startPrefix)
    const b = body.findIndex((s: any) => s.segmentPrefix === d.endPrefix)
    sections.push({ label: d.label, count: b - a + 1 })
  }
  return sections
}

test.describe('Brás Cubas hub — editorial reading divisions (collapsible map)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('skepvox-consent', 'denied')
      } catch {
        /* storage unavailable */
      }
    })
  })

  test('renders visible Abertura plus 10 collapsible division rows, each with its count; no map note', async ({
    page
  }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(BRAS_HUB)
    const nav = page.locator('nav.pwc')
    await expect(nav).toBeVisible()

    const expected = expectedSections()
    expect(expected.length).toBe(10)
    const sections = nav.locator('.pwc__section')
    await expect(sections).toHaveCount(expected.length)

    // each section is a disclosure row (same .pwc__chapter-heading button as a Lavelle chapter), with the
    // right label + count of final reading units, COLLAPSED by default
    for (let i = 0; i < expected.length; i++) {
      const head = sections.nth(i).locator('.pwc__chapter-heading')
      await expect(head.locator('.pwc__chapter-title')).toHaveText(expected[i].label)
      await expect(head.locator('.pwc__count')).toHaveText(String(expected[i].count))
      await expect(head).toHaveAttribute('aria-expanded', 'false')
    }
    // Abertura is visible front matter, not a disclosure section; first/last body divisions read as expected
    await expect(nav.locator('.pwc__opening-heading')).toHaveText('Abertura')
    await expect(nav.locator('.pwc__opening a.pwc__link--loose')).toHaveCount(3)
    expect(expected[0].label).toBe('O Defunto Autor')
    expect(expected[9].label).toBe('Últimas Voltas')
    await expect(nav.locator('.pwc__chapters-heading')).toHaveText('Capítulos')

    // the OLD always-open dividers / generic flat list are gone
    await expect(nav.locator('.pwc__division-heading')).toHaveCount(0)
    await expect(nav.locator('.pwc__part--editorial')).toHaveCount(0)
    await expect(nav.locator('a.pwc__chapter-row')).toHaveCount(0) // no raw wall of rows

    // No explicit editorial disclaimer on the hub; the site as a whole is an editorial reading surface.
    await expect(page.locator('.pwc__map-note')).toHaveCount(0)
    await expect(page.getByText(/agrupamento editorial/i)).toHaveCount(0)

    expect(errors).toEqual([]) // SSR/hydration did not throw
  })

  test('chapter-segments live inside collapsed regions; expanding a division reveals them', async ({
    page
  }) => {
    await page.goto(BRAS_HUB)
    const nav = page.locator('nav.pwc')
    // all 160 chapter-segment leaves are SSR'd (in the DOM for crawlability) but inside .pwc__leaves
    await expect(nav.locator('a.pwc__link--numbered')).toHaveCount(160)
    await expect(nav.locator('.pwc__leaves a.pwc__link--numbered')).toHaveCount(160)

    // a mid-book division is collapsed by default, then opens to reveal its chapter-segment leaves
    const div = nav.locator('.pwc__section').filter({
      has: page.locator('.pwc__chapter-title', { hasText: /^Virgília$/ })
    }) // 47–63
    const head = div.locator('.pwc__chapter-heading')
    await expect(div.locator('.pwc__leaves')).toBeHidden()
    await head.click()
    await expect(head).toHaveAttribute('aria-expanded', 'true')
    await expect(div.locator('.pwc__leaves')).toBeVisible()
    const leaves = div.locator('a.pwc__link--numbered')
    await expect(leaves.first()).toBeVisible()
    // a revealed leaf shows the quiet chapter-number tab + the title
    await expect(leaves.first().locator('.pwc__leaf-num')).toHaveText('47')
  })

  test('open/closed state persists across reload (boolean disclosure state only)', async ({
    page
  }) => {
    await page.goto(BRAS_HUB)
    const head = page.locator('nav.pwc .pwc__section').nth(1).locator('.pwc__chapter-heading')
    await head.click()
    await expect(head).toHaveAttribute('aria-expanded', 'true')
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('skepvox:pwc:machado-de-assis/bras-cubas:pt')
    )
    const parsed = JSON.parse(stored as string) as Record<string, unknown>
    for (const v of Object.values(parsed)) expect(typeof v).toBe('boolean') // no progress/identity
    await page.reload()
    await expect(
      page.locator('nav.pwc .pwc__section').nth(1).locator('.pwc__chapter-heading')
    ).toHaveAttribute('aria-expanded', 'true')
  })

  test('hash return opens the containing division and highlights the chapter-segment', async ({
    page
  }) => {
    // ch 84 "O conflito" lives in the 6th division (Inquietações, 78–101)
    await page.goto(BRAS_HUB + '#trecho-00-00-084-087')
    const current = page.locator('nav.pwc a.pwc__link.is-current')
    await expect(current).toHaveCount(1)
    await expect(current).toBeVisible() // visible ⇒ its division was opened
    await expect(current).toHaveAttribute('aria-current', 'page')
    await expect(current).toHaveAttribute('href', /00-00-084-087$/)
  })

  test('hash return into front matter highlights visible Abertura without opening a section', async ({
    page
  }) => {
    await page.goto(BRAS_HUB + '#trecho-00-00-000-001')
    const current = page.locator('nav.pwc a.pwc__link.is-current')
    await expect(current).toHaveCount(1)
    await expect(current).toBeVisible()
    await expect(current).toHaveText('Dedicatória')
    await expect(current).toHaveAttribute('aria-current', 'page')
    await expect(
      page.locator('nav.pwc .pwc__section').first().locator('.pwc__chapter-heading')
    ).toHaveAttribute('aria-expanded', 'false')
  })

  test('every chapter link resolves; prefix-only leaves; no legacy /literatura/ leak; metadata-only', () => {
    const html = fs.readFileSync(BRAS_HUB_HTML, 'utf-8')
    const links = brasLinks(html)
    // the 160 chapter routes + 3 front-matter routes are exactly the 163 pt leaves, all built
    const routes = brasPt()
      .map((s: any) => `/${s.routePath}`)
      .sort()
    expect([...links].sort()).toEqual(routes)
    expect(links.length).toBe(163)
    for (const l of links) expect(builtExists(l), l).toBe(true)
    // prefix-only bare leaves; the retired hand-authored /literatura/ corpus must not return
    expect(html.includes('href="/literatura/')).toBe(false)
    for (const l of links)
      expect(l, l).toMatch(
        /\/pt\/literatura\/machado-de-assis\/bras-cubas\/\d\d-\d\d-\d\d\d-\d\d\d$/
      )
    // metadata-only: a distinctive ch.1 BODY sentence must never appear on the hub
    expect(html.includes('Algum tempo hesitei se devia abrir estas memórias')).toBe(false)
    const src = fs.readFileSync(COMPONENT, 'utf-8')
    expect(src.includes("import meta from '../data/pipeline-export-segments.json'")).toBe(true)
    expect(/import\s+\w+\s+from\s+['"][^'"]*prose/.test(src)).toBe(false)
    expect('readingDivisions' in (read(META).segments as Record<string, unknown>[])[0]).toBe(false)
  })

  test('Lavelle hub uses the SAME disclosure grammar and is otherwise unchanged', async ({
    page
  }) => {
    await page.goto(LAVELLE_HUB)
    const nav = page.locator('nav.pwc')
    // same disclosure-button grammar as Brás Cubas (collapsible rows with counts + chevrons)…
    await expect(nav.locator('.pwc__chapter-heading')).toHaveCount(10) // the 10 authored chapters
    await expect(nav.locator('.pwc__count').first()).toBeVisible()
    // …but Lavelle keeps its authored structure: two Part dividers, no editorial divisions/note
    await expect(nav.locator('.pwc__part-heading')).toHaveCount(2)
    await expect(nav.locator('.pwc__division-heading')).toHaveCount(0)
    await expect(page.locator('.pwc__map-note')).toHaveCount(0)
    // Lavelle front matter stays a VISIBLE loose list (NOT converted to a collapsible Abertura section)
    await expect(nav.locator('.pwc__opening-heading')).toHaveText('Abertura')
    await expect(nav.locator('.pwc__link--loose')).toHaveCount(1) // Advertência
    await expect(nav.locator('.pwc__section')).toHaveCount(0) // flat-work sections are Brás-Cubas-only
    await expect(nav.locator('.pwc__chapters-heading')).toHaveCount(0) // Brás-Cubas-only body divider
    // Lavelle paragraph leaves now share Brás Cubas's calm left ordinal rail for final reading units.
    await nav.locator('.pwc__chapter-heading').first().click()
    const firstLeaf = nav.locator('.pwc__leaves a.pwc__link--numbered').first()
    await expect(firstLeaf.locator('.pwc__leaf-num')).toHaveText('1')
    await expect(firstLeaf.locator('.pwc__leaf-title')).toHaveText('Parágrafo 1')
  })
})
