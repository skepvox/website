import { test, expect } from '@playwright/test'

// A6 — the homepage is a calm editorial index into the three site pillars (Literatura / Filosofia /
// Podcasts), not a marketing hero: a quiet left-aligned masthead (eyebrow -> wordmark -> subline) over a
// hairline table-of-contents. Real-DOM checks against the built site (vitepress preview).
const PILLARS = [
  { label: 'Literatura', href: '/pt/literatura/' },
  { label: 'Filosofia', href: '/pt/filosofia/' },
  { label: 'Podcasts', href: '/podcast/' }
]

test.describe('homepage — three-pillar index', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders exactly the three pillars, in order, as section links', async ({ page }) => {
    await expect(page.locator('.home-pillars a.pillar')).toHaveCount(3)
    await expect(page.locator('.home-pillars a.pillar h2')).toHaveText(PILLARS.map((p) => p.label))
  })

  test('each pillar links to its current section surface', async ({ page }) => {
    for (const { label, href } of PILLARS) {
      await expect(
        page.locator(`.home-pillars a.pillar[href="${href}"]`),
        `${label} -> ${href}`
      ).toHaveCount(1)
    }
  })

  test('Filosofia points to the locale-rooted /pt/filosofia/ section, never the legacy or author route', async ({
    page
  }) => {
    await expect(page.locator('a.pillar[href="/pt/filosofia/"]')).toHaveCount(1)
    await expect(page.locator('a[href^="/louis-lavelle/"]')).toHaveCount(0) // removed legacy route
    await expect(page.locator('a.pillar[href="/pt/filosofia/louis-lavelle/"]')).toHaveCount(0) // author hub is not a pillar
  })

  test('the masthead is a calm entry point, not a 76px marketing hero', async ({ page }) => {
    const mark = page.locator('.home-masthead__mark')
    await expect(mark).toHaveText('skepvox')
    // the wordmark is token-scaled (--sk-masthead clamps to 1.85rem..2.25rem = ~30-36px): bounded BOTH
    // ways, so neither the old 76px hero nor a collapsed/missing --sk-masthead token passes
    const px = await mark.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(px).toBeGreaterThanOrEqual(24)
    expect(px).toBeLessThanOrEqual(40)
    await expect(page.locator('.tagline')).toHaveCount(0) // the old centered marketing tagline is gone
    await expect(page.locator('.home-masthead__eyebrow')).toHaveText('Engenharia de Letras') // identity kept, quieted
  })

  test('the masthead carries no links; the three pillars are the only homepage links', async ({
    page
  }) => {
    await expect(page.locator('.home-masthead a')).toHaveCount(0)
    const hrefs = await page
      .locator('.home-index a')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')))
    expect(hrefs.sort()).toEqual(['/podcast/', '/pt/filosofia/', '/pt/literatura/'])
  })

  test('meta description names the three pillars (no Louis Lavelle author framing)', async ({
    page
  }) => {
    const desc = (await page.locator('head meta[name="description"]').getAttribute('content')) ?? ''
    expect(desc).toContain('Literatura')
    expect(desc.toLowerCase()).toContain('filosofia')
    expect(desc.toLowerCase()).toContain('podcast')
    expect(desc).not.toContain('Louis Lavelle')
  })

  test('the pillars stack as a single column with no horizontal overflow (mobile + desktop)', async ({
    page
  }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
    // the hairline TOC always stacks: three rows at three distinct vertical positions, every viewport
    const tops = await page
      .locator('.home-pillars a.pillar')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)))
    expect(new Set(tops).size).toBe(3)
  })
})
