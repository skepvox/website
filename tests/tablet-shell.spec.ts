import { test, expect } from '@playwright/test'

// Narrow tablet coverage — ONLY the 768-1279px shell/nav dead-band, run by the dedicated
// 'tablet' Playwright project (its testMatch limits that project to this file, so the
// full suite is NOT duplicated at tablet width). The skip guard means the desktop/mobile
// projects, which also match this file, skip it rather than run it at the wrong viewport.
test.describe('768-1279px shell dead-band (tablet)', () => {
  test('the appearance toggle is reachable in the top bar and flips the theme', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet', 'tablet dead-band coverage only')

    await page.addInitScript(() => {
      localStorage.setItem('vitepress-theme-appearance', 'light')
    })
    await page.goto('/')

    // Pre-fix this band had NO reachable toggle: the theme shows the navbar switch only
    // >=1280px, the hamburger overlay is gone >=768px, and the drawer has none. The
    // pages.css bridge force-shows the top-bar switch up to 1279.98px.
    const topSwitch = page.locator('.VPNavBar .VPNavBarAppearance .vt-switch-appearance')
    await expect(topSwitch).toBeVisible()

    await topSwitch.click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#181510')

    await topSwitch.click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#fcfcfa')

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
