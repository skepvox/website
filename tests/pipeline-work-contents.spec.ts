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

// Slice E — readiness gate: lock the certified template invariants so it is safe to multiply to the
// fr edition + the next book: the Abertura front-matter group, the apparatus-line readability the
// Slice D concern flagged (measured-resolved), the expanded-row 44px tap floor, and the metadata-only
// / own-prose performance boundary.
test.describe('PipelineWorkContents — Slice E readiness gate', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('skepvox-consent', 'denied')
      } catch {
        /* storage unavailable */
      }
    })
  })

  test('front matter renders under a SUBORDINATE "Abertura" group (render-layer only; no invented Part/route)', async ({
    page
  }) => {
    await page.goto(HUB)
    const opening = page.locator('.pwc__opening-heading')
    await expect(opening).toHaveCount(1)
    await expect(opening).toHaveText('Abertura')
    // the loose front-matter link (Advertência) sits under the Abertura group, still its own pt leaf route
    const adv = page.locator('.pwc__opening a.pwc__link--loose')
    await expect(adv).toHaveText('Advertência')
    await expect(adv).toHaveAttribute('href', /00-00-000-001-advertencia$/)
    // subordinate to authored Part dividers: the Abertura label has NO trailing hairline; Parts do
    const hairline = (sel: string) =>
      page
        .locator(sel)
        .first()
        .evaluate((el) => {
          const a = getComputedStyle(el, '::after')
          return a.content !== 'none' && parseFloat(a.flexGrow || '0') > 0
        })
    expect(await hairline('.pwc__opening-heading')).toBe(false)
    expect(await hairline('.pwc__part-heading')).toBe(true)
  })

  test('expanded segment rows preserve the >=44px tap target', async ({ page }) => {
    await page.goto(HUB)
    await page.locator('nav.pwc .pwc__chapter-heading').first().click()
    await page.waitForTimeout(300)
    const heights = await page
      .locator('.pwc__leaves a.pwc__link')
      .evaluateAll((els) =>
        els.slice(0, 6).map((e) => Math.round(e.getBoundingClientRect().height))
      )
    expect(heights.length).toBeGreaterThanOrEqual(6)
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(44)
  })

  test('performance boundary: pipeline-export metadata has NO prose; a leaf carries only its own prose', () => {
    const data = JSON.parse(
      fs.readFileSync(path.resolve('.vitepress/theme/data/pipeline-export-segments.json'), 'utf-8')
    )
    const keys = new Set<string>(
      (data.segments as Record<string, unknown>[]).flatMap((s) => Object.keys(s))
    )
    for (const p of ['prose', 'body', 'text', 'content', 'html', 'markdown'])
      expect(keys.has(p)).toBe(false)
    const leaf = fs.readFileSync(
      path.resolve(
        '.vitepress/dist/louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7.html'
      ),
      'utf-8'
    )
    // a leaf is its own static page — no all-99 bundle: far-away segment titles must not appear
    for (const far of ['Parágrafo 20', 'Parágrafo 50', 'Parágrafo 90'])
      expect(leaf.includes(far)).toBe(false)
  })

  test('no docs artifacts on the leaf (rented pager / sidebar / aside / edit-link)', () => {
    const leaf = fs.readFileSync(
      path.resolve(
        '.vitepress/dist/louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7.html'
      ),
      'utf-8'
    )
    for (const art of [
      'VPDocFooter',
      'next-link',
      'prev-link',
      'edit-link',
      'VPSidebar',
      'VPDocAside',
      'class="VPDoc '
    ])
      expect(leaf.includes(art)).toBe(false)
  })

  for (const dark of [false, true]) {
    test(`apparatus readability (${dark ? 'dark' : 'light'}): edition/Abertura/part labels clear 3:1 + the part divider stays distinct from the muted labels`, async ({
      page
    }) => {
      await page.addInitScript((d) => {
        try {
          localStorage.setItem('vitepress-theme-appearance', d ? 'dark' : 'light')
          localStorage.setItem('skepvox-consent', 'denied')
        } catch {
          /* storage unavailable */
        }
      }, dark)
      await page.goto(HUB)
      const metric = (sel: string) =>
        page
          .locator(sel)
          .first()
          .evaluate((el) => {
            const parse = (c: string) => {
              const m = (c.match(/[\d.]+/g) || []).map(Number)
              return { r: m[0] || 0, g: m[1] || 0, b: m[2] || 0, a: m[3] ?? 1 }
            }
            const lin = (v: number) => {
              v /= 255
              return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
            }
            const lum = (c: { r: number; g: number; b: number }) =>
              0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
            const bgOf = (n: Element | null) => {
              while (n) {
                const c = getComputedStyle(n).backgroundColor
                if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return parse(c)
                n = n.parentElement
              }
              return { r: 255, g: 255, b: 255, a: 1 }
            }
            const s = parse(getComputedStyle(el).color)
            const bg = bgOf(el)
            const eff = {
              r: s.a * s.r + (1 - s.a) * bg.r,
              g: s.a * s.g + (1 - s.a) * bg.g,
              b: s.a * s.b + (1 - s.a) * bg.b
            }
            const L1 = lum(eff)
            const Lb = lum(bg)
            return { lum: L1, ratio: (Math.max(L1, Lb) + 0.05) / (Math.min(L1, Lb) + 0.05) }
          })
      const ed = await metric('.pwc__edition')
      const op = await metric('.pwc__opening-heading')
      const part = await metric('.pwc__part-heading')
      // all three apparatus lines clear the 3:1 UI/non-text bar against the surface
      expect(ed.ratio).toBeGreaterThanOrEqual(3)
      expect(op.ratio).toBeGreaterThanOrEqual(3)
      expect(part.ratio).toBeGreaterThanOrEqual(3)
      // the authored Part divider stays clearly distinct (brighter ink) from the muted edition + Abertura
      // labels — never undifferentiated grey (the Slice D concern, measured-resolved in both modes)
      const mutual = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      expect(mutual(part.lum, ed.lum)).toBeGreaterThan(1.5)
      expect(mutual(part.lum, op.lum)).toBeGreaterThan(1.5)
    })
  }
})
