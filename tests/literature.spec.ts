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

// SSR work cards on each author hub via CardGrid + generated works.json. Cards
// represent work hub pages only (no chapter/section pages) and carry no images.
// File-based; requires a prior build (pnpm build / pnpm podcast:build).
test.describe('literature author hub work grids', () => {
  const HUBS = [
    {
      author: 'machado-de-assis',
      works: [
        'bras-cubas',
        'quincas-borba',
        'dom-casmurro',
        'esau-e-jaco',
        'o-alienista',
        'a-cartomante'
      ]
    },
    { author: 'graciliano-ramos', works: ['sao-bernardo', 'angustia', 'vidas-secas'] },
    { author: 'raul-pompeia', works: ['o-ateneu'] }
  ]
  const gridOf = (author: string) => {
    const html = fs.readFileSync(
      path.resolve(`.vitepress/dist/literatura/${author}/index.html`),
      'utf-8'
    )
    return html.match(/<ul class="card-grid".*?<\/ul>/s)?.[0] ?? ''
  }

  for (const { author, works } of HUBS) {
    test(`${author}: renders an SSR work-card grid with ${works.length} cards`, () => {
      const grid = gridOf(author)
      expect(grid).toContain('class="card-grid"')
      expect((grid.match(/class="card-grid__item"/g) || []).length).toBe(works.length)
    })

    test(`${author}: links to each hosted work hub`, () => {
      const grid = gridOf(author)
      for (const slug of works) {
        expect(grid).toContain(`href="/literatura/${author}/${slug}"`)
      }
    })

    test(`${author}: work cards are text-only (no card art)`, () => {
      expect(gridOf(author)).not.toContain('card-grid__art')
    })

    test(`${author}: no chapter/section links leak into the grid`, () => {
      const links = [...gridOf(author).matchAll(/href="(\/literatura\/[^"]+)"/g)].map((m) => m[1])
      expect(links.length).toBe(works.length)
      // every link is a work hub: /literatura/<author>/<slug>, no further path segment
      for (const href of links) {
        expect(href).toMatch(new RegExp(`^/literatura/${author}/[^/]+$`))
      }
    })
  }
})
