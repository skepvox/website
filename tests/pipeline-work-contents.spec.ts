import { test, expect } from '@playwright/test'

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
})
