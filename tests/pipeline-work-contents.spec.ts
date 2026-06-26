import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Owned reader-shell proof slice — live interaction for the PipelineWorkContents map on the pt work
// hub. Runs on the desktop + mobile projects (the tablet project only runs tablet-shell), so the
// collapse/persistence/dark behaviour is exercised at both widths.
const HUB = '/louis-lavelle/introducao-a-ontologia/'
const STORAGE_KEY = 'skepvox:pwc:louis-lavelle/introduction-a-l-ontologie:pt'

test.describe('PipelineWorkContents (owned pt work-hub contents map)', () => {
  // Dismiss the GA consent banner (fixed, bottom) so it never intercepts clicks on bottom-of-page
  // navigation (e.g. a leaf's "up" link). The banner is site-wide chrome, not reader-shell behaviour.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('skepvox-consent', 'denied')
      } catch {
        /* storage unavailable */
      }
    })
  })

  test('renders the SSR contents skeleton: front matter, 2 parts, 10 chapters, 99 links', async ({
    page
  }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(HUB)

    const nav = page.locator('nav.pwc')
    await expect(nav).toBeVisible()
    // front matter (Advertência) sits flush above the parts
    await expect(nav.locator('.pwc__link--loose')).toHaveCount(1)
    await expect(nav.locator('.pwc__link--loose').first()).toHaveText('Advertência')
    // two visible part labels, ten chapter disclosure buttons
    await expect(nav.locator('.pwc__part-heading')).toHaveCount(2)
    await expect(nav.locator('.pwc__chapter-heading')).toHaveCount(10)
    // every pt segment link is present in the DOM (SSR'd; collapsed chapters keep them via v-show)
    await expect(nav.locator('a.pwc__link')).toHaveCount(99)
    // SSR did not break: no uncaught client errors on load
    expect(errors).toEqual([])
  })

  test('chapters default collapsed; a disclosure button toggles aria-expanded and its region', async ({
    page
  }) => {
    await page.goto(HUB)
    const first = page.locator('nav.pwc .pwc__chapter-heading').first()
    await expect(first).toHaveAttribute('aria-expanded', 'false')
    const regionId = await first.getAttribute('aria-controls')
    const region = page.locator(`#${regionId}`)
    await expect(region).toBeHidden()

    await first.click()
    await expect(first).toHaveAttribute('aria-expanded', 'true')
    await expect(region).toBeVisible()
    await expect(region.locator('a.pwc__link').first()).toBeVisible()

    await first.click()
    await expect(first).toHaveAttribute('aria-expanded', 'false')
    await expect(region).toBeHidden()
  })

  test('open/closed state persists across reload via localStorage (no progress signal)', async ({
    page
  }) => {
    await page.goto(HUB)
    const first = page.locator('nav.pwc .pwc__chapter-heading').first()
    await expect(first).toHaveAttribute('aria-expanded', 'false')
    await first.click()
    await expect(first).toHaveAttribute('aria-expanded', 'true')

    const stored = await page.evaluate((k) => window.localStorage.getItem(k), STORAGE_KEY)
    expect(stored).toBeTruthy()
    // only boolean open/closed flags — never last-read position or progress
    const parsed = JSON.parse(stored as string) as Record<string, unknown>
    for (const v of Object.values(parsed)) expect(typeof v).toBe('boolean')

    await page.reload()
    const firstAfter = page.locator('nav.pwc .pwc__chapter-heading').first()
    await expect(firstAfter).toHaveAttribute('aria-expanded', 'true')
  })

  test('renders cleanly in dark mode', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('vitepress-theme-appearance', 'dark')
    })
    await page.goto(HUB)
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('nav.pwc')).toBeVisible()
    await expect(page.locator('nav.pwc a.pwc__link')).toHaveCount(99)
  })

  test('returning with #trecho-<prefix> opens + highlights that chapter segment', async ({
    page
  }) => {
    // a mid-book chapter segment (00-01-002 "Ser") — its chapter is collapsed by default
    await page.goto(HUB + '#trecho-00-01-002-008')
    const current = page.locator('nav.pwc a.pwc__link.is-current')
    await expect(current).toHaveCount(1)
    await expect(current).toHaveAttribute('aria-current', 'page')
    await expect(current).toBeVisible() // visible => its chapter was opened (v-show)
    await expect(current).toHaveAttribute(
      'href',
      '/louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7'
    )
  })

  test('returning with the front-matter prefix highlights the loose Advertência link', async ({
    page
  }) => {
    await page.goto(HUB + '#trecho-00-00-000-001')
    const current = page.locator('nav.pwc a.pwc__link--loose.is-current')
    await expect(current).toHaveCount(1)
    await expect(current).toHaveText('Advertência')
    await expect(current).toHaveAttribute('aria-current', 'page')
  })

  test('a normal hub visit (no hash) highlights nothing', async ({ page }) => {
    await page.goto(HUB)
    await expect(page.locator('nav.pwc a.pwc__link.is-current')).toHaveCount(0)
  })

  test('clicking a leaf "up" link returns to the hub and highlights the trecho', async ({
    page
  }) => {
    await page.goto('/louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7')
    await page.locator('[data-testid="pseg-up"]').click()
    await expect(page).toHaveURL(/#trecho-00-01-002-008$/)
    const current = page.locator('nav.pwc a.pwc__link.is-current')
    await expect(current).toHaveCount(1)
    await expect(current).toHaveAttribute('aria-current', 'page')
    await expect(current).toBeVisible()
  })

  test('Slice A: title leads the hierarchy with an edition line; rows no longer out-size chapters', async ({
    page
  }) => {
    await page.goto(HUB)
    // the edition/context line under the title exists and names the edition
    await expect(page.locator('.pwc__edition')).toContainText(/edição em português/i)
    const size = await page.evaluate(() => {
      const px = (sel: string) => {
        const el = document.querySelector(sel)
        return el ? parseFloat(getComputedStyle(el).fontSize) : 0
      }
      return {
        title: px('.pwc__title'),
        edition: px('.pwc__edition'),
        chapter: px('nav.pwc .pwc__chapter-heading'),
        row: px('nav.pwc a.pwc__link')
      }
    })
    expect(size.title).toBeGreaterThan(size.chapter) // the title is the largest element
    expect(size.title).toBeLessThan(40) // down from 40px (was 2.5rem)
    expect(size.edition).toBeGreaterThan(0)
    // hierarchy inversion fixed: segment rows are no longer LARGER than their chapter disclosure
    expect(size.row).toBeLessThanOrEqual(size.chapter)
  })

  test('Slice C3: hub swapped to the owned ReaderIcon disclosure; CSS triangle gone; reduced-motion kept; no ad hoc SVG', () => {
    const hub = fs.readFileSync(
      path.resolve('.vitepress/theme/components/PipelineWorkContents.vue'),
      'utf-8'
    )
    // swapped to the owned wrapper, disclosure glyph
    expect(hub.includes("import ReaderIcon from './ReaderIcon.vue'")).toBe(true)
    expect(hub.includes('name="disclosure"')).toBe(true) // the owned disclosure glyph
    // the border-triangle implementation + its opacity-dim are removed
    expect(hub.includes('border-left: 5px solid currentColor')).toBe(false)
    expect(hub.includes('opacity: 0.45')).toBe(false)
    // rotation stays a CSS transform on the wrapper class — NOT a new ReaderIcon prop
    expect(hub.includes('.pwc__chevron.is-open')).toBe(true)
    expect(hub.includes('transform: rotate(90deg)')).toBe(true)
    expect(hub.includes('rotate=')).toBe(false) // no rotate prop on ReaderIcon
    // reduced-motion still gates the chevron transition
    expect(/prefers-reduced-motion: reduce[\s\S]*pwc__chevron/.test(hub)).toBe(true)
    // governance: no per-glyph ad hoc inline SVG in the consumer
    expect(/<svg[\s>]/.test(hub)).toBe(false)
    // C2 untouched: PipelineSegmentNav still imports ReaderIcon
    const nav = fs.readFileSync(
      path.resolve('.vitepress/theme/components/PipelineSegmentNav.vue'),
      'utf-8'
    )
    expect(nav.includes("import ReaderIcon from './ReaderIcon.vue'")).toBe(true)
  })

  test('Slice C3: disclosure is a decorative ReaderIcon; rotation toggles with state; name = chapter title', async ({
    page
  }) => {
    await page.goto(HUB)
    const btn = page.locator('nav.pwc .pwc__chapter-heading').first()
    const svg = btn.locator('svg.reader-icon')
    await expect(svg).toHaveCount(1)
    // decorative: aria-hidden + focusable=false; no <title>
    expect(await svg.getAttribute('aria-hidden')).toBe('true')
    expect(await svg.getAttribute('focusable')).toBe('false')
    await expect(svg.locator('title')).toHaveCount(0)
    // accessible name = the chapter title only (count + icon are aria-hidden, excluded)
    const title = ((await btn.locator('.pwc__chapter-title').textContent()) || '').trim()
    expect(title.length).toBeGreaterThan(0)
    expect(await btn.locator('.pwc__count').getAttribute('aria-hidden')).toBe('true')
    // collapsed: rests as a right chevron (no is-open, no rotation)
    await expect(svg).not.toHaveClass(/is-open/)
    const collapsed = await svg.evaluate((el) => getComputedStyle(el).transform)
    // open it: gains is-open and rotates to point down
    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'true')
    await expect(svg).toHaveClass(/is-open/)
    await page.waitForTimeout(240) // let the 150ms rotation settle
    const opened = await svg.evaluate((el) => getComputedStyle(el).transform)
    expect(opened).not.toBe(collapsed) // rotation changed with state
    expect(opened).not.toBe('none') // a real 90° transform when open
  })
})

// Slice D — raise the hub from "functional contents list" to a composed, bookish reading-app entry
// surface: a printed-table-of-contents in the book's own (Literata) voice, with the small-caps part
// dividers + tabular counts as quiet sans apparatus. The structural invariants (collapse/return/
// metadata-only/no-fr-leak) are locked above + in pipeline-work-hub.spec; these lock the COMPOSITION.
test.describe('PipelineWorkContents — Slice D composed bookish surface', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('skepvox-consent', 'denied')
      } catch {
        /* storage unavailable */
      }
    })
  })

  const fam = (page: import('@playwright/test').Page, sel: string) =>
    page
      .locator(sel)
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily.toLowerCase())
  const px = (page: import('@playwright/test').Page, sel: string) =>
    page
      .locator(sel)
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))

  test('exactly one h1 (the work title), owned by the contents component — no duplicated/detached docs title', async ({
    page
  }) => {
    await page.goto(HUB)
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)
    await expect(h1).toHaveText('Introdução à ontologia')
    await expect(h1).toHaveAttribute('id', 'pwc-title')
    // the title lives INSIDE the masthead of the contents component (one composed surface),
    // not as a separate docs page heading floating above/below the component
    await expect(page.locator('.pwc__head #pwc-title')).toHaveCount(1)
    // no stray h2/h3 docs headings leak onto the hub (parts are integrated <p> dividers, not headings)
    await expect(page.locator('.vp-doc h2, .vp-doc h3')).toHaveCount(0)
  })

  test('the title + chapter/segment entries are the serif (Literata) reading voice; apparatus stays sans', async ({
    page
  }) => {
    await page.goto(HUB)
    expect(await fam(page, '.pwc__title')).toContain('literata') // serif title — the Slice D experiment, KEPT
    expect(await fam(page, '.pwc__chapter-title')).toContain('literata') // serif chapter entries
    expect(await fam(page, 'a.pwc__link')).toContain('literata') // serif segment + front-matter rows
    // the apparatus — part dividers + per-chapter counts — stays sans for contrast (not the book voice)
    expect(await fam(page, '.pwc__part-heading')).not.toContain('literata')
    expect(await fam(page, '.pwc__count')).not.toContain('literata')
  })

  test('masthead hierarchy + printed-TOC apparatus: title > chapter, edition line, hairline, tabular counts, scroll-margin', async ({
    page
  }) => {
    await page.goto(HUB)
    // the serif title outranks the chapter rows (hierarchy holds; Slice A invariant preserved)
    expect(await px(page, '.pwc__title')).toBeGreaterThan(await px(page, '.pwc__chapter-title'))
    // the edition context line names the edition (small-caps apparatus under the title)
    await expect(page.locator('.pwc__edition')).toContainText(/edição em português/i)
    // the masthead is bound to the contents by a hairline (composed, not a detached header box)
    const headBorder = await page
      .locator('.pwc__head')
      .evaluate((el) => parseFloat(getComputedStyle(el).borderBottomWidth))
    expect(headBorder).toBeGreaterThan(0)
    // tabular figure counts + current-row scroll-margin (roadmap Slice D apparatus)
    expect(
      await page
        .locator('.pwc__count')
        .first()
        .evaluate((el) => getComputedStyle(el).fontVariantNumeric)
    ).toContain('tabular-nums')
    expect(
      await page
        .locator('a.pwc__link')
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).scrollMarginTop))
    ).toBeGreaterThan(0)
  })
})
