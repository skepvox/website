import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// The public site's first-level mental model is three visible pillars (Literatura / Filosofia / Vox
// Français), centralized in .vitepress/theme/components/pillars.ts and shared by the homepage + global
// nav so they cannot drift (slice H2). Filosofia + Literatura are the locale-rooted /pt/<section>/
// sections; the visible podcast pillar is Vox Français (/podcast/francais/) — Vox Español / Vox English
// stay public and reachable by URL / the /podcast/ hub / the podcast sidebar / the sitemap, just not
// promoted in the primary IA. No /louis-lavelle/ links, no redirects. File-based against src + the built
// dist (needs a prior build).
const DIST = path.resolve('.vitepress/dist')
const SRC = path.resolve('src')
const read = (p: string) => fs.readFileSync(p, 'utf-8')
const builtHub = (route: string) =>
  fs.existsSync(path.join(DIST, route.replace(/^\/|\/$/g, ''), 'index.html'))

const PILLARS = [
  { label: 'Literatura', href: '/pt/literatura/' },
  { label: 'Filosofia', href: '/pt/filosofia/' },
  { label: 'Vox Français', href: '/podcast/francais/' }
]

test.describe('A6 — three-pillar IA (homepage, nav, 404)', () => {
  test('pillars.ts is the three visible pillars in order; nav derives from them with Home first; no legacy Lavelle', () => {
    // The visible pillars are centralized in pillars.ts and shared with the nav, so assert the IA at its
    // source of truth rather than re-parsing literal nav entries (the nav now spreads PILLARS).
    const pillars = read(path.resolve('.vitepress/theme/components/pillars.ts'))
    const labels = [...pillars.matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1])
    expect(labels).toEqual(['Literatura', 'Filosofia', 'Vox Français'])
    expect(pillars).toContain("href: '/pt/literatura/'")
    expect(pillars).toContain("href: '/pt/filosofia/'")
    expect(pillars).toContain("href: '/podcast/francais/'")
    expect(pillars.includes('/louis-lavelle/')).toBe(false)

    // The global nav keeps Home first, then derives the visible pillars from PILLARS (one source of truth).
    const config = read(path.resolve('.vitepress/config.ts'))
    expect(config).toContain("from './theme/components/pillars'")
    const nav = config.slice(config.indexOf('const nav'), config.indexOf('export const sidebar'))
    expect(nav).toContain("text: 'Home'")
    expect(nav).toContain('PILLARS')
    expect(nav.includes('/louis-lavelle/')).toBe(false)
  })

  test('the 404 source offers the three pillars and no legacy /louis-lavelle/ link', () => {
    // VitePress renders 404 as a client-side NotFound component, so the static 404.html carries no body
    // anchors — the 404.md source is the genuine guard (the built nav/siteData is covered by the nav test).
    const md = read(path.join(SRC, '404.md'))
    expect(md).toContain('[Literatura](/pt/literatura/)')
    expect(md).toContain('[Filosofia](/pt/filosofia/)')
    expect(md).toContain('[Vox Français](/podcast/francais/)')
    expect(md.includes('/louis-lavelle/')).toBe(false)
  })

  test('the homepage HTML + structured data carry the three pillars and no legacy Lavelle URL', () => {
    const html = read(path.join(DIST, 'index.html'))
    for (const { href } of PILLARS) expect(html, href).toContain(`href="${href}"`)
    // JSON-LD lists the three section URLs (format-agnostic substrings); the visible podcast pillar is
    // Vox Français (/podcast/francais/), not the generic /podcast/ hub.
    expect(html).toContain('skepvox.com/pt/literatura/')
    expect(html).toContain('skepvox.com/pt/filosofia/')
    expect(html).toContain('skepvox.com/podcast/francais/')
    // no legacy route anywhere, and the author framing is fully gone from the homepage
    expect(html.includes('/louis-lavelle/')).toBe(false)
    expect(html.includes('Louis Lavelle')).toBe(false)
  })

  test('each pillar destination is a real, built surface (no migration, no dead pillar)', () => {
    expect(builtHub('/pt/literatura/')).toBe(true)
    expect(builtHub('/pt/filosofia/')).toBe(true)
    expect(builtHub('/podcast/francais/')).toBe(true)
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
