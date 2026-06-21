import { test, expect } from '@playwright/test'

// SSR work cards on /louis-lavelle/: two CardGrid blocks in the "Obras no skepvox"
// section — a Portuguese translation, then the 9 French originals with publication
// years. Checked against the real DOM of the built site (served by vitepress
// preview), not by regex over minified HTML.
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
  test.beforeEach(async ({ page }) => {
    await page.goto('/louis-lavelle/')
  })

  test('renders exactly two CardGrid blocks in the Obras section', async ({ page }) => {
    await expect(page.locator('.card-grid')).toHaveCount(2)
    // both grids sit between the "Obras no skepvox" and "Identidade" headings
    const inObrasSection = await page.evaluate(() => {
      const obras = document.querySelector('h2#obras-no-skepvox')!
      const ident = document.querySelector('h2#identidade')!
      return [...document.querySelectorAll('.card-grid')].filter(
        (g) =>
          obras.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING &&
          ident.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_PRECEDING
      ).length
    })
    expect(inObrasSection).toBe(2)
  })

  test('first block contains only the pt-BR translation', async ({ page }) => {
    const pt = page.locator('.card-grid').nth(0)
    await expect(pt.locator('.card-grid__item')).toHaveCount(1)
    await expect(pt.locator('a[href="/louis-lavelle/a-consciencia-de-si"]')).toHaveCount(1)
    await expect(pt.locator('.card-grid__meta')).toHaveText('Tradução pt-BR')
  })

  test('second block contains only the 9 French originals', async ({ page }) => {
    const fr = page.locator('.card-grid').nth(1)
    await expect(fr.locator('.card-grid__item')).toHaveCount(9)
    for (const slug of FRENCH) {
      await expect(fr.locator(`a[href="/louis-lavelle/${slug}"]`)).toHaveCount(1)
    }
    // the pt-BR translation is not counted among the French originals
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

  // Markdown/Vue HTML-block swallowing regression, on the real DOM: an HTML block
  // with no trailing blank line can absorb the following heading/section.
  test('grids do not swallow the Identidade heading or section', async ({ page }) => {
    await expect(page.locator('h2#identidade')).toHaveCount(1)
    const dom = await page.evaluate(() => {
      const ident = document.querySelector('h2#identidade')!
      // no card-grid item lives inside the Identidade section (until the next h2)
      let identSectionItems = 0
      for (let n = ident.nextElementSibling; n && n.tagName !== 'H2'; n = n.nextElementSibling) {
        identSectionItems += n.querySelectorAll('.card-grid__item').length
      }
      const h2ids = [...document.querySelectorAll('h2[id]')].map((h) => h.id)
      return { identSectionItems, h2ids }
    })
    expect(dom.identSectionItems).toBe(0)
    // heading order preserved: Obras no skepvox -> Identidade -> Visão geral -> ...
    const obrasIdx = dom.h2ids.indexOf('obras-no-skepvox')
    expect(obrasIdx).toBeGreaterThanOrEqual(0)
    expect(dom.h2ids.slice(obrasIdx, obrasIdx + 3)).toEqual([
      'obras-no-skepvox',
      'identidade',
      'visao-geral'
    ])
  })
})
