import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Reading-navigation manifest (build-reading-nav.py) + ReadingNav.vue, rendered in
// the content-top/content-bottom slots on book chapter leaves. File-based against the
// committed manifest and the built site; no builders or local-books/ involved.
const DIST = path.resolve('.vitepress/dist')
const MANIFEST = path.resolve('.vitepress/theme/data/reading-nav.json')

const html = (route: string) => fs.readFileSync(path.join(DIST, `${route}.html`), 'utf-8')
const manifest = () =>
  JSON.parse(fs.readFileSync(MANIFEST, 'utf-8')) as Record<string, [string, string][]>

const LIT_FIRST = 'literatura/graciliano-ramos/vidas-secas/00-00-001-mudanca'
const LIT_MID = 'literatura/machado-de-assis/dom-casmurro/00-08-074-a-presilha'
const LIT_LAST = 'literatura/machado-de-assis/dom-casmurro/00-15-148-ebem-e-o-resto'
const LAV_FR = 'louis-lavelle/de-l-etre/00-00-001-de-la-primaute-de-l-etre'
const LAV_PT =
  'louis-lavelle/a-consciencia-de-si/00-00-000-001-i-a-consciencia-de-si-e-o-erro-de-narciso'

function navText(page: string): string {
  return (page.match(/<nav class="reading-nav[^"]*"[\s\S]*?<\/nav>/g) || [])
    .map((block) => block.replace(/<[^>]+>/g, ' '))
    .join(' ')
}

function contextText(page: string): string {
  const m = page.match(/<p class="reading-context"[^>]*>([\s\S]*?)<\/p>/)
  return m ? m[1].replace(/<[^>]+>/g, ' ') : ''
}

test.describe('reading-nav manifest', () => {
  test('is keyed by work route with ordered [slug, displayTitle] rows', () => {
    const m = manifest()
    expect(Object.keys(m).length).toBeGreaterThan(10)
    for (const [route, rows] of Object.entries(m)) {
      expect(route.startsWith('/')).toBe(true)
      for (const row of rows) {
        expect(row).toHaveLength(2)
        expect(typeof row[0]).toBe('string')
        expect(typeof row[1]).toBe('string')
        expect(row[1]).not.toMatch(/^\d\d-\d\d-\d/) // displayTitle is never a slug
      }
    }
  })

  test('order is deterministic filename sort, including cross-part books', () => {
    const rows = manifest()['/literatura/machado-de-assis/dom-casmurro']
    expect(rows).toHaveLength(148)
    const slugs = rows.map((r) => r[0])
    expect(slugs).toEqual([...slugs].sort())
    expect(slugs[0]).toBe('00-01-001-do-titulo')
    expect(slugs.at(-1)).toBe('00-15-148-ebem-e-o-resto')
  })

  test('Lavelle FR work is included despite leaves lacking chapter-id', () => {
    const rows = manifest()['/louis-lavelle/de-l-etre']
    expect(rows.length).toBeGreaterThan(1)
    expect(rows[0][1]).toContain("primauté de l'être")
  })

  test('Lavelle pt-BR four-group slugs are included and correctly ordered', () => {
    const rows = manifest()['/louis-lavelle/a-consciencia-de-si']
    expect(rows.length).toBeGreaterThan(100)
    expect(rows[0][0]).toMatch(/^\d\d-\d\d-\d\d\d-\d\d\d-/)
    const slugs = rows.map((r) => r[0])
    expect(slugs).toEqual([...slugs].sort())
  })

  test('every manifest href resolves to a built page', () => {
    for (const [route, rows] of Object.entries(manifest())) {
      for (const [slug] of rows) {
        expect(
          fs.existsSync(path.join(DIST, route.slice(1), `${slug}.html`)),
          `${route}/${slug}`
        ).toBe(true)
      }
    }
  })

  test('generator is idempotent', () => {
    const out = execFileSync('python3', ['scripts/build-reading-nav.py'], {
      encoding: 'utf-8'
    }).trim()
    expect(out).toBe('No reading-nav changes.')
  })
})

test.describe('reading-nav component (SSR)', () => {
  test('top is quiet bibliographic context only — not a nav, no prev/next', () => {
    const page = html(LIT_MID)
    const context = contextText(page)
    expect(context).toContain('Dom Casmurro')
    expect(context).toContain('Machado de Assis')
    expect(page).not.toContain('reading-nav--top') // top is not a <nav>
    expect(context).not.toMatch(/Anterior|Próximo|Précédent|Suivant/) // no nav in top
  })

  test('bottom nav is the only prev/next navigation on a literature leaf', () => {
    const page = html(LIT_MID)
    expect(page).toContain('reading-nav--bottom')
    const text = navText(page)
    expect(text).toContain('Anterior')
    expect(text).toContain('Próximo')
  })

  test('renders on a Lavelle FR leaf with French labels', () => {
    const text = navText(html(LAV_FR))
    expect(text).toContain('Suivant')
    expect(text).not.toContain('Próximo')
  })

  test('renders on a Lavelle pt-BR leaf with Portuguese labels', () => {
    const text = navText(html(LAV_PT))
    expect(text).toContain('Próximo')
    expect(text).not.toContain('Suivant')
  })

  test('first chapter has next-only, last chapter has prev-only', () => {
    const first = navText(html(LIT_FIRST))
    expect(first).toContain('Próximo')
    expect(first).not.toContain('Anterior')
    const last = navText(html(LIT_LAST))
    expect(last).toContain('Anterior')
    expect(last).not.toContain('Próximo')
  })

  test('shows neighbour titles, never numbered slugs, as visible text', () => {
    const text = navText(html(LIT_MID))
    expect(text).toContain('O Contrarregra') // prev title
    expect(text).toContain('O Desespero') // next title
    expect(text).not.toMatch(/00-\d\d-\d\d\d-/) // no slug shown
  })

  test('top context and bottom nav are both absent on hubs, single-file works, podcast, home', () => {
    for (const route of [
      'literatura/index',
      'literatura/machado-de-assis/index',
      'literatura/machado-de-assis/dom-casmurro', // work hub
      'literatura/raul-pompeia/o-ateneu', // single-file work
      'podcast/francais/001-le-badge',
      'index' // home
    ]) {
      expect(html(route), route).not.toContain('class="reading-context"')
      expect(html(route), route).not.toContain('class="reading-nav')
    }
  })

  test('BufferNotice is absent on the released francais-003 page', () => {
    expect(html('podcast/francais/003-le-covoiturage-poli')).not.toContain('class="buffer-notice"')
  })
})
