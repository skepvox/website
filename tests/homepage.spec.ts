import { test, expect } from '@playwright/test'

// The homepage reflects the three site pillars (Louis Lavelle, Literatura,
// Podcasts) as three clickable peer .vt-box cards — 3-up on desktop, 1-up on
// mobile. Real-DOM checks against the built site (vitepress preview).
test.describe('homepage pillars', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows exactly three peer pillar boxes in order', async ({ page }) => {
    await expect(page.locator('#highlights a.vt-box')).toHaveCount(3)
    await expect(page.locator('#highlights a.vt-box h2')).toHaveText([
      'Louis Lavelle',
      'Literatura',
      'Podcasts'
    ])
  })

  test('uses the three cards as the only homepage pillar links', async ({ page }) => {
    await expect(page.locator('#hero a')).toHaveCount(0)
    await expect(page.locator('#hero .description')).toHaveCount(0)
    for (const href of ['/louis-lavelle/', '/literatura/', '/podcast/']) {
      await expect(page.locator(`#highlights a.vt-box[href="${href}"]`)).toHaveCount(1)
    }
  })

  test('boxes are 3-up on desktop / 1-up on mobile with no horizontal overflow', async ({
    page
  }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
    const tops = await page
      .locator('#highlights a.vt-box')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)))
    const distinctRows = new Set(tops).size
    if (page.viewportSize()!.width >= 700) {
      expect(distinctRows).toBe(1) // 3-up: a single row
    } else {
      expect(distinctRows).toBe(3) // 1-up: stacked
    }
  })

  test('meta description names all three pillars (no two-pillar regression)', async ({ page }) => {
    const desc = await page.locator('head meta[name="description"]').getAttribute('content')
    expect(desc).toContain('Louis Lavelle')
    expect(desc).toContain('literatura')
    expect(desc).toContain('podcasts')
  })
})
