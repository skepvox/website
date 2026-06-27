import { test, expect } from '@playwright/test'
import { PILLARS } from '../.vitepress/theme/components/pillars'

// The homepage is a calm editorial index into the three visible site pillars (Literatura / Filosofia /
// Vox Français), not a marketing hero: a quiet left-aligned masthead (wordmark -> subline) over a
// hairline table-of-contents. The visible podcast pillar is Vox Français (H2 IA narrowing); Vox
// Español / English stay public but unpromoted. Real-DOM checks against the built site (vitepress
// preview).

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
    // H6: prove the live-preview mechanism without growing a per-book/per-episode homepage matrix.
    const live = page.locator('.home-pillars .pillar__live')
    await expect(live).toHaveCount(PILLARS.length)
    await expect(live).toHaveText([/^\d{4} · .+/, /^\d{4} · .+/, /^\d{3} · .+/])
    await expect(page.locator('.home-pillars')).not.toContainText(/capítulos|trechos/)

    // the preview is title-only — it never reintroduces author framing on the homepage
    await expect(page.locator('.home-pillars')).not.toContainText('Louis Lavelle')
    // and it adds no links inside the pillar surface
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
    // the wordmark is token-scaled (--sk-masthead clamps to 1.85rem..2.25rem = ~30-36px): bounded BOTH
    // ways, so neither the old 76px hero nor a collapsed/missing --sk-masthead token passes
    const px = await mark.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(px).toBeGreaterThanOrEqual(24)
    expect(px).toBeLessThanOrEqual(40)
    await expect(page.locator('.tagline')).toHaveCount(0) // the old centered marketing tagline is gone
    await expect(page.locator('.home-masthead__eyebrow')).toHaveCount(0) // no slogan/eyebrow above the personal index
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
    // the hairline TOC always stacks: three rows at three distinct vertical positions, every viewport
    const tops = await page
      .locator('.home-pillars a.pillar')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)))
    expect(new Set(tops).size).toBe(3)
  })
})
