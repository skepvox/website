import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// A6 — the public site is reframed around three pillars (Literatura / Filosofia / Podcasts) as the
// first-level mental model, WITHOUT migrating books or podcasts. The homepage, global nav, and 404 all
// point into this structure: Filosofia is the locale-rooted /pt/filosofia/ section; Literatura + Podcasts
// keep their current (legacy) surfaces, unmoved. No /louis-lavelle/ links, no redirects. File-based
// against src + the built dist (needs a prior build).
const DIST = path.resolve('.vitepress/dist')
const SRC = path.resolve('src')
const read = (p: string) => fs.readFileSync(p, 'utf-8')
const builtHub = (route: string) =>
  fs.existsSync(path.join(DIST, route.replace(/^\/|\/$/g, ''), 'index.html'))

const PILLARS = [
  { label: 'Literatura', href: '/pt/literatura/' },
  { label: 'Filosofia', href: '/pt/filosofia/' },
  { label: 'Podcasts', href: '/podcast/' }
]

test.describe('A6 — three-pillar IA (homepage, nav, 404)', () => {
  test('the global nav is the three pillars in order; Filosofia is /pt/filosofia/; no legacy Lavelle', () => {
    const config = read(path.resolve('.vitepress/config.ts'))
    const nav = config.slice(config.indexOf('const nav'), config.indexOf('export const sidebar'))
    const order = [...nav.matchAll(/text:\s*'([^']+)'/g)].map((m) => m[1])
    expect(order).toEqual(['Home', 'Literatura', 'Filosofia', 'Podcasts'])
    expect(nav).toContain("link: '/pt/literatura/'")
    expect(nav).toContain("link: '/pt/filosofia/'")
    expect(nav).toContain("link: '/podcast/'")
    expect(nav.includes('/louis-lavelle/')).toBe(false)
  })

  test('the 404 source offers the three pillars and no legacy /louis-lavelle/ link', () => {
    // VitePress renders 404 as a client-side NotFound component, so the static 404.html carries no body
    // anchors — the 404.md source is the genuine guard (the built nav/siteData is covered by the nav test).
    const md = read(path.join(SRC, '404.md'))
    expect(md).toContain('[Literatura](/pt/literatura/)')
    expect(md).toContain('[Filosofia](/pt/filosofia/)')
    expect(md).toContain('[Podcasts](/podcast/)')
    expect(md.includes('/louis-lavelle/')).toBe(false)
  })

  test('the homepage HTML + structured data carry the three pillars and no legacy Lavelle URL', () => {
    const html = read(path.join(DIST, 'index.html'))
    for (const { href } of PILLARS) expect(html, href).toContain(`href="${href}"`)
    // JSON-LD lists the three section URLs (format-agnostic substrings)
    expect(html).toContain('skepvox.com/pt/literatura/')
    expect(html).toContain('skepvox.com/pt/filosofia/')
    expect(html).toContain('skepvox.com/podcast/')
    // no legacy route anywhere, and the author framing is fully gone from the homepage
    expect(html.includes('/louis-lavelle/')).toBe(false)
    expect(html.includes('Louis Lavelle')).toBe(false)
  })

  test('each pillar destination is a real, built surface (no migration, no dead pillar)', () => {
    expect(builtHub('/pt/literatura/')).toBe(true)
    expect(builtHub('/pt/filosofia/')).toBe(true)
    expect(builtHub('/podcast/')).toBe(true)
  })

  test('the existing Filosofia book + Introdução reader still build (unmoved by A6)', () => {
    expect(builtHub('/pt/filosofia/louis-lavelle/')).toBe(true)
    expect(builtHub('/pt/filosofia/louis-lavelle/introducao-a-ontologia/')).toBe(true)
    expect(
      fs.existsSync(
        path.join(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.html')
      )
    ).toBe(true)
  })

  test('A6 introduces no redirects (clean break preserved)', () => {
    expect(fs.existsSync(path.join(SRC, 'public/_redirects'))).toBe(false)
    expect(fs.existsSync(path.join(DIST, '_redirects'))).toBe(false)
  })
})
