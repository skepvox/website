import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// SSR author cards on /literatura/ via the shared CardGrid + literatureAuthorCards.
// Notably surfaces Raul Pompeia, who was previously missing from the landing.
// File-based; requires a prior build (pnpm build / pnpm podcast:build).
test.describe('literature author grid', () => {
  const HTML = path.resolve('.vitepress/dist/literatura/index.html')

  test('renders three SSR author cards', () => {
    const html = fs.readFileSync(HTML, 'utf-8')
    expect(html).toContain('class="card-grid"')
    expect((html.match(/class="card-grid__item"/g) || []).length).toBe(3)
  })

  test('cards link to all three author hubs', () => {
    const html = fs.readFileSync(HTML, 'utf-8')
    for (const author of ['machado-de-assis', 'graciliano-ramos', 'raul-pompeia']) {
      expect(html).toContain(`href="/literatura/${author}/"`)
    }
  })

  test('surfaces Raul Pompeia as a text-only card (no portrait)', () => {
    const html = fs.readFileSync(HTML, 'utf-8')
    const grid = html.match(/<ul class="card-grid".*?<\/ul>/s)?.[0] ?? ''
    expect(grid).toContain('Raul Pompeia')
    expect(grid).toContain('href="/literatura/raul-pompeia/"')
    // only Machado + Graciliano have portrait images; Raul is text-only
    expect((grid.match(/class="card-grid__art"/g) || []).length).toBe(2)
  })
})
