import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice F1 — the static reader-location path that replaces the two-line PipelineReaderHeader. A
// semantic breadcrumb (<nav aria-label> > <ol role=list>) rendered as a calm bookish location line:
// Sumário (link) · Part (text) · Chapter (real <h2>, link → hub#trecho) · current Segment (real <h3>,
// aria-current). Static, no sticky/scroll, no icon separator, no data change.
const HUB = '/louis-lavelle/introducao-a-ontologia/'
const COMP = path.resolve('.vitepress/theme/components/PipelineReaderHeader.vue')
const data = JSON.parse(
  fs.readFileSync(path.resolve('.vitepress/theme/data/pipeline-export-segments.json'), 'utf-8')
)
const pt = (data.segments as Record<string, unknown>[])
  .filter((s) => s.language === 'pt')
  .sort((a, b) => (a.order as number) - (b.order as number))
const routeOf = (s: Record<string, unknown>) => '/' + (s.routePath as string)
const MID = pt.find((s) => s.segmentPrefix === '00-01-002-008') as Record<string, unknown> // Ser / Parágrafo 7
const FRONT = pt.find((s) => s.segmentPrefix === '00-00-000-001') as Record<string, unknown> // Advertência
const LAST = pt[pt.length - 1] // 99-99-999-099 — conclusion sentinel (empty groupPath)

test.describe('PipelineReaderHeader — Slice F1 reader-location path', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('skepvox-consent', 'denied')
      } catch {
        /* storage unavailable */
      }
    })
  })

  test('mid-book leaf: nav.pseg-loc breadcrumb — Sumário(link) · Part(text) · Chapter(h2 link) · Segment(h3 current)', async ({
    page
  }) => {
    await page.goto(routeOf(MID))
    const loc = page.locator('nav.pseg-loc')
    await expect(loc).toHaveCount(1)
    await expect(loc).toHaveAttribute('aria-label', 'Localização')
    await expect(loc.locator('ol[role="list"]')).toHaveCount(1)

    // exactly one real <h2> + one real <h3> page-wide, h2 before h3, none in the prose body (SEO)
    await expect(page.locator('.VPContentDoc h2')).toHaveCount(1)
    await expect(page.locator('.VPContentDoc h3')).toHaveCount(1)
    await expect(page.locator('.VPContentDoc .vt-doc h2, .VPContentDoc .vt-doc h3')).toHaveCount(0)
    await expect(loc.locator('h2')).toHaveText('Ser') // chapter (textContent, transform-agnostic)
    await expect(loc.locator('h3')).toHaveText('Parágrafo 7') // segment (mixed case)
    const headingOrder = await loc.evaluate((el) =>
      [...el.querySelectorAll('h2, h3')].map((h) => h.tagName).join(',')
    )
    expect(headingOrder).toBe('H2,H3')

    // exactly two links: Sumário → hub top; Chapter (the <h2>) → hub#trecho-<current>
    await expect(loc.locator('a')).toHaveCount(2)
    await expect(loc.locator('a').first()).toHaveAttribute('href', HUB) // Sumário
    await expect(loc.locator('a').first()).toContainText('Sumário')
    await expect(loc.locator('h2 a')).toHaveAttribute('href', `${HUB}#trecho-00-01-002-008`) // Chapter

    // Part = plain text (no anchor); current segment = plain text + aria-current="location"
    await expect(loc.locator('.pseg-loc__rung--part a')).toHaveCount(0)
    await expect(loc).toContainText('Primeira parte')
    await expect(loc.locator('h3 a')).toHaveCount(0)
    await expect(loc.locator('h3')).toHaveAttribute('aria-current', 'location')

    // no docs-breadcrumb separator, no icon
    const text = await loc.innerText()
    expect(text.includes('>')).toBe(false)
    expect(text.includes('/')).toBe(false)
    await expect(loc.locator('svg')).toHaveCount(0)
  })

  test('the location-path rungs (Sumário, Part, Chapter h2) share a baseline — no vertical drift', async ({
    page
  }) => {
    await page.goto(routeOf(MID))
    const tops = await page.evaluate(() => {
      const textTop = (sel: string) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const r = document.createRange()
        r.selectNodeContents(el)
        return r.getBoundingClientRect().top
      }
      return {
        sumario: textTop('nav.pseg-loc li:nth-child(1) a'),
        part: textTop('nav.pseg-loc .pseg-loc__part'),
        chapter: textTop('nav.pseg-loc h2 a')
      }
    })
    const vals = [tops.sumario, tops.part, tops.chapter].filter((v) => v != null) as number[]
    expect(vals.length).toBe(3)
    expect(Math.max(...vals) - Math.min(...vals)).toBeLessThanOrEqual(1.5) // tight baseline tolerance
    // the chapter rung is the real <h2> but normalized inline: no margin, inherited kicker type
    const h2 = await page.locator('nav.pseg-loc h2').evaluate((el) => {
      const cs = getComputedStyle(el)
      return { margin: cs.margin, fontSize: cs.fontSize, display: cs.display }
    })
    expect(h2.margin).toBe('0px')
    expect(h2.fontSize).toBe('13px') // inherited --sk-reading-kicker, identical to the other rungs
  })

  test('separators are decorative (aria-hidden), kept out of the accessibility tree', async ({
    page
  }) => {
    await page.goto(routeOf(MID))
    const seps = page.locator('nav.pseg-loc .pseg-loc__sep')
    await expect(seps.first()).toBeVisible()
    for (const sep of await seps.all()) expect(await sep.getAttribute('aria-hidden')).toBe('true')
  })

  test('front matter (Advertência): Sumário · Abertura · Advertência — no chapter h2, one h3 current', async ({
    page
  }) => {
    await page.goto(routeOf(FRONT))
    const loc = page.locator('nav.pseg-loc')
    await expect(loc).toHaveCount(1)
    await expect(loc.locator('h2')).toHaveCount(0) // no chapter level
    await expect(loc.locator('h3')).toHaveText('Advertência')
    await expect(loc.locator('h3')).toHaveAttribute('aria-current', 'location')
    await expect(loc).toContainText('Abertura')
    // only Sumário is a link in front matter; Abertura is plain text
    await expect(loc.locator('a')).toHaveCount(1)
    await expect(loc.locator('a').first()).toHaveAttribute('href', HUB)
    await expect(page.locator('.VPContentDoc h2')).toHaveCount(0)
    await expect(page.locator('.VPContentDoc h3')).toHaveCount(1)
  })

  test('conclusion sentinel (99-99-999, empty groupPath): Sumário · <segment> — NOT mislabelled "Abertura"', async ({
    page
  }) => {
    await page.goto(routeOf(LAST))
    const loc = page.locator('nav.pseg-loc')
    await expect(loc).toHaveCount(1)
    await expect(loc).not.toContainText('Abertura') // conclusion is not the opening
    await expect(loc.locator('h2')).toHaveCount(0)
    await expect(loc.locator('h3')).toHaveText('Parágrafo 98')
    await expect(loc.locator('h3')).toHaveAttribute('aria-current', 'location')
    await expect(loc.locator('a')).toHaveCount(1) // only Sumário
    await expect(loc.locator('a').first()).toHaveAttribute('href', HUB)
  })

  test('no fr / old-chapter / reading-review / routePath-as-identity href leak in the path', async ({
    page
  }) => {
    await page.goto(routeOf(MID))
    const hrefs = await page
      .locator('nav.pseg-loc a')
      .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href') || ''))
    expect(hrefs.length).toBeGreaterThan(0)
    for (const h of hrefs) {
      expect(h.includes('introduction-a-l-ontologie')).toBe(false) // fr edition
      expect(h.includes('reading-review')).toBe(false)
      expect(h.startsWith(HUB)).toBe(true) // only the hub / hub#trecho
    }
  })

  test('the top path is ORIENTATION; the bottom PipelineSegmentNav still owns the ACTION (distinct navs)', async ({
    page
  }) => {
    await page.goto(routeOf(MID))
    await expect(page.locator('[data-testid="pseg-nav"]')).toBeVisible()
    await expect(page.locator('[data-testid="pseg-up"]')).toHaveCount(1) // bottom up-link remains
    await expect(page.locator('nav.pseg-loc')).toHaveAttribute('aria-label', 'Localização')
    await expect(page.locator('[data-testid="pseg-nav"]')).toHaveAttribute(
      'aria-label',
      'Navegação de trechos'
    )
  })

  test('static + perf: no sticky/scroll machinery, no prose import, metadata-only, no icon', () => {
    const src = fs.readFileSync(COMP, 'utf-8')
    expect(/position:\s*(sticky|fixed)/.test(src)).toBe(false)
    expect(src.includes('IntersectionObserver')).toBe(false)
    expect(/addEventListener\(\s*['"]scroll/.test(src)).toBe(false)
    expect(src.includes('onMounted')).toBe(false)
    // imports only the metadata JSON the reader shell already bundles — no prose / preview / manifest
    expect(src.includes("import meta from '../data/pipeline-export-segments.json'")).toBe(true)
    expect(/import[^\n]*(prose|preview-window|segment-manifest)/.test(src)).toBe(false)
    // no ReaderIcon / raw svg separator in the header
    expect(src.includes('ReaderIcon')).toBe(false)
    expect(/<svg[\s>]/.test(src)).toBe(false)
  })
})
