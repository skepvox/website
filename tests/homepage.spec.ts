import { test, expect } from '@playwright/test'
import { PILLARS } from '../.vitepress/theme/components/pillars'

test.describe('homepage — three-pillar index', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders exactly the three pillars, in order, as section links', async ({ page }) => {
    await expect(page.locator('.home-pillars a.pillar')).toHaveCount(3)
    await expect(page.locator('.home-pillars a.pillar h2')).toHaveText(PILLARS.map((p) => p.label))
    await expect(page.locator('.home-pillars a.pillar .pillar__blurb')).toHaveText(
      PILLARS.map((p) => p.blurb)
    )
  })

  test('the pillars surface one quiet preview line each without adding links', async ({ page }) => {
    const live = page.locator('.home-pillars .pillar__live')
    await expect(live).toHaveCount(PILLARS.length)
    await expect(live).toHaveText([/^\d{4} · .+/, /^\d{4} · .+/, /^\d{3} · .+/])
    await expect(page.locator('.home-pillars')).not.toContainText(/capítulos|trechos/)

    await expect(page.locator('.home-pillars')).not.toContainText('Louis Lavelle')
    await expect(page.locator('.home-pillars a.pillar')).toHaveCount(PILLARS.length)
    await expect(page.locator('.home-pillars a:not(.pillar)')).toHaveCount(0)
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
    const px = await mark.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(px).toBeGreaterThanOrEqual(24)
    expect(px).toBeLessThanOrEqual(40)
    await expect(page.locator('.tagline')).toHaveCount(0)
    await expect(page.locator('.home-masthead__eyebrow')).toHaveCount(0)
    await expect(page.locator('.home-masthead__subline')).toHaveText(
      'Leituras e estudos pessoais, reunidos em três seções.'
    )
  })

  test('the masthead carries no links; the three pillars are the only homepage links', async ({
    page
  }) => {
    await expect(page.locator('.home-masthead a')).toHaveCount(0)
    const hrefs = await page
      .locator('.home-pillars a.pillar')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')))
    expect(hrefs.sort()).toEqual(PILLARS.map((p) => p.href).sort())
    await expect(page.locator('.home-pillars a[href="/podcast/"]')).toHaveCount(0)
  })

  test('the homepage stays a restrained gateway, not a card grid or marketing landing page', async ({
    page
  }) => {
    await expect(page.locator('.home-index .vt-box, .home-index .VPFeature')).toHaveCount(0)
    await expect(page.locator('.home-index')).not.toContainText('Engenharia de Letras')
    await expect(page.locator('.home-index a[href^="/louis-lavelle/"]')).toHaveCount(0)
  })

  test('the pillars carry an owned mark, not a decorative arrow', async ({ page }) => {
    await expect(page.locator('.pillar__go')).toHaveCount(0)
    await expect(page.locator('.home-pillars svg.brand-mark')).toHaveCount(3)
    const hasArrow = await page
      .locator('.home-pillars')
      .evaluate((el) => (el.textContent || '').includes('→'))
    expect(hasArrow).toBe(false)
  })

  test('meta description keeps the personal index tone (no old slogan or author framing)', async ({
    page
  }) => {
    const desc = (await page.locator('head meta[name="description"]').getAttribute('content')) ?? ''
    expect(desc).toBe('Leituras e estudos pessoais, reunidos em três seções.')
    expect(desc).not.toContain('Engenharia de Letras')
    expect(desc).not.toContain('Louis Lavelle')
  })

  test('the pillars stack as a single column with no horizontal overflow (mobile + desktop)', async ({
    page
  }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
    const tops = await page
      .locator('.home-pillars a.pillar')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)))
    expect(new Set(tops).size).toBe(3)
  })
})
