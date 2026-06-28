import { test, expect } from '@playwright/test'

test.describe('768-1279px shell dead-band (tablet)', () => {
  test('the appearance toggle is reachable in the top bar and flips the theme', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet', 'tablet dead-band coverage only')

    await page.addInitScript(() => {
      localStorage.setItem('vitepress-theme-appearance', 'light')
    })
    await page.goto('/')

    const topSwitch = page.locator('.VPNavBar .VPNavBarAppearance .vt-switch-appearance')
    await expect(topSwitch).toBeVisible()

    await topSwitch.click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#181510')

    await topSwitch.click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f6f1e6')

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
