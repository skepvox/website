import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// SSR work cards on /louis-lavelle/: one CardGrid block under "Obras
// traduzidas" and one under "Obras originais". Checked against the real DOM of
// the built site (served by vitepress preview), not by regex over minified HTML.
const FRENCH = [
  'de-l-etre',
  'la-conscience-de-soi',
  'la-presence-totale',
  'de-l-acte',
  'l-erreur-de-narcisse',
  'du-temps-et-de-l-eternite',
  'introduction-a-l-ontologie',
  'de-l-ame-humaine',
  'quatre-saints'
]

test.describe('louis lavelle work grids', () => {
  const CONFIG = path.resolve('.vitepress/config.ts')

  test.beforeEach(async ({ page }) => {
    await page.goto('/louis-lavelle/')
  })

  test('sidebar starts at work collections without a duplicate Lavelle or Biografia row', () => {
    const config = fs.readFileSync(CONFIG, 'utf-8')
    expect(config).toMatch(
      /'\/louis-lavelle\/': \[\s*\{\s*text: "La Dialectique de l'éternel présent"/
    )
    expect(config).not.toContain("text: 'Louis Lavelle'")
    expect(config).not.toContain("text: 'Biografia'")
  })

  test('renders translated and original work sections with one grid each', async ({ page }) => {
    await expect(page.locator('.card-grid')).toHaveCount(2)
    const structure = await page.evaluate(() => {
      const translated = document.querySelector('h2#obras-traduzidas')!
      const originals = document.querySelector('h2#obras-originais')!
      const grids = [...document.querySelectorAll('.card-grid')]
      return {
        h2ids: [...document.querySelectorAll('h2[id]')].map((h) => h.id),
        firstGridAfterTranslated:
          translated.compareDocumentPosition(grids[0]) & Node.DOCUMENT_POSITION_FOLLOWING,
        originalsAfterFirstGrid:
          grids[0].compareDocumentPosition(originals) & Node.DOCUMENT_POSITION_FOLLOWING,
        secondGridAfterOriginals:
          originals.compareDocumentPosition(grids[1]) & Node.DOCUMENT_POSITION_FOLLOWING
      }
    })
    expect(structure.h2ids).toEqual(['obras-traduzidas', 'obras-originais'])
    expect(Boolean(structure.firstGridAfterTranslated)).toBe(true)
    expect(Boolean(structure.originalsAfterFirstGrid)).toBe(true)
    expect(Boolean(structure.secondGridAfterOriginals)).toBe(true)
  })

  test('first block contains only the Portuguese version', async ({ page }) => {
    const pt = page.locator('.card-grid').nth(0)
    await expect(pt.locator('.card-grid__item')).toHaveCount(1)
    await expect(pt.locator('a[href="/louis-lavelle/a-consciencia-de-si"]')).toHaveCount(1)
    await expect(pt.locator('.card-grid__meta')).toHaveText('1933')
  })

  test('second block contains only the 9 French originals', async ({ page }) => {
    const fr = page.locator('.card-grid').nth(1)
    await expect(fr.locator('.card-grid__item')).toHaveCount(9)
    for (const slug of FRENCH) {
      await expect(fr.locator(`a[href="/louis-lavelle/${slug}"]`)).toHaveCount(1)
    }
    // the Portuguese version is not counted among the French originals
    await expect(fr.locator('a[href="/louis-lavelle/a-consciencia-de-si"]')).toHaveCount(0)
  })

  test('French cards show publication-year meta in chronological order', async ({ page }) => {
    const metas = await page
      .locator('.card-grid')
      .nth(1)
      .locator('.card-grid__meta')
      .allInnerTexts()
    expect(metas).toEqual(['1928', '1933', '1934', '1937', '1939', '1945', '1947', '1951', '1951'])
  })

  test('cards link only to work hubs, never chapter/section pages', async ({ page }) => {
    const hrefs = await page
      .locator('.card-grid a')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href') || ''))
    expect(hrefs).toHaveLength(10)
    for (const href of hrefs) {
      expect(href).toMatch(/^\/louis-lavelle\/[^/]+$/)
    }
  })

  test('keeps the hub visually spare: one portrait and no secondary Lavelle assets', async ({
    page
  }) => {
    await expect(page.locator('img.lavelle-portrait')).toHaveCount(1)
    await expect(page.locator('img[src*="/images/louis-lavelle/"]')).toHaveCount(0)
    const contentH2Ids = await page
      .locator('.vt-doc h2[id]')
      .evaluateAll((els) => els.map((el) => el.id))
    expect(contentH2Ids).toEqual(['obras-traduzidas', 'obras-originais'])
  })
})
