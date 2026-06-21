import { test, expect } from '@playwright/test'

test.describe('mobile theme toggle', () => {
  test('is reachable in the top bar and syncs chrome while the nav is open', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile navbar polish only')

    await page.addInitScript(() => {
      localStorage.setItem('vitepress-theme-appearance', 'light')
    })
    await page.goto('/')

    const topSwitch = page.locator('.VPNavBar .VPNavBarAppearance .vt-switch-appearance')
    await expect(topSwitch).toBeVisible()

    await page.locator('.VPNavBarHamburger.vt-hamburger').click()
    await expect(page.locator('.VPNavScreen')).toBeVisible()
    await expect(page.locator('.VPNavScreenAppearance')).toBeHidden()

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
