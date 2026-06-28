import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const component = (rel: string) =>
  fs.readFileSync(path.resolve('.vitepress/theme/components', rel), 'utf-8')

test.describe('owned mark layers stay separate', () => {
  test('BrandMark is its own registry; ReaderIcon stays the four navigation glyphs', () => {
    const readerIcons = component('reader-icons.ts')
    const brandMarks = component('brand-marks.ts')
    expect(readerIcons).toContain("'chevron-left' | 'chevron-right' | 'chevron-up' | 'disclosure'")
    for (const name of ['literatura', 'filosofia', 'vox-francais', 'rider', 'play', 'pause'])
      expect(readerIcons.includes(name)).toBe(false)
    for (const name of ['literatura', 'filosofia', 'vox-francais', 'play', 'pause'])
      expect(brandMarks).toContain(name)
    expect(brandMarks.includes('chevron')).toBe(false)
    expect(brandMarks.includes('disclosure')).toBe(false)
  })

  test('BrandMark renders a decorative aria-hidden svg by default', async ({ page }) => {
    await page.goto('/')
    const marks = page.locator('.home-pillars svg.brand-mark')
    await expect(marks).toHaveCount(3)
    expect(await marks.first().getAttribute('aria-hidden')).toBe('true')
    expect(await marks.first().getAttribute('focusable')).toBe('false')
    await expect(marks.first().locator('title')).toHaveCount(0)
  })
})
