import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { PILLARS } from '../.vitepress/theme/components/pillars'

const DIST = path.resolve('.vitepress/dist')
const SRC = path.resolve('src')
const read = (p: string) => fs.readFileSync(p, 'utf-8')
const PILLAR_HREFS = PILLARS.map((p) => p.href)

test.describe('three-pillar IA (homepage, nav, 404)', () => {
  test('pillars.ts is the three visible pillars in order; nav derives from them with Home first; no legacy Lavelle', () => {
    expect(PILLARS.map(({ label, href }) => ({ label, href }))).toEqual([
      { label: 'Literatura', href: '/pt/literatura/' },
      { label: 'Filosofia', href: '/pt/filosofia/' },
      { label: 'Vox Français', href: '/podcast/francais/' }
    ])

    const pillars = read(path.resolve('.vitepress/theme/components/pillars.ts'))
    expect(pillars.includes('/louis-lavelle/')).toBe(false)

    const config = read(path.resolve('.vitepress/config.ts'))
    expect(config).toContain("from './theme/components/pillars'")
    const nav = config.slice(config.indexOf('const nav'), config.indexOf('export const sidebar'))
    expect(nav).toContain("text: 'Home'")
    expect(nav).toContain('PILLARS')
    expect(nav.includes('/louis-lavelle/')).toBe(false)
  })

  test('the 404 source offers the three pillars and no legacy /louis-lavelle/ link', () => {
    const md = read(path.join(SRC, '404.md'))
    expect(md).toContain('[Literatura](/pt/literatura/)')
    expect(md).toContain('[Filosofia](/pt/filosofia/)')
    expect(md).toContain('[Vox Français](/podcast/francais/)')
    expect(md.includes('/louis-lavelle/')).toBe(false)
  })

  test('the homepage HTML + structured data carry the three pillars and no legacy Lavelle URL', () => {
    const html = read(path.join(DIST, 'index.html'))
    for (const href of PILLAR_HREFS) expect(html, href).toContain(`href="${href}"`)
    expect(html).toContain('skepvox.com/pt/literatura/')
    expect(html).toContain('skepvox.com/pt/filosofia/')
    expect(html).toContain('skepvox.com/podcast/francais/')
    expect(html.includes('/louis-lavelle/')).toBe(false)
    expect(html.includes('Louis Lavelle')).toBe(false)
    expect(html.includes('Engenharia de Letras')).toBe(false)
    expect(html).toContain('skepvox — Leituras e Estudos Pessoais')
    expect(html).toContain('Leituras e estudos pessoais, reunidos em três seções.')
  })

  test('Home.vue renders the live previews via helper layers, never importing the pipeline-export JSON', () => {
    const home = read(path.resolve('.vitepress/theme/components/Home.vue'))
    expect(home).toContain("from './literatura-cards'")
    expect(home).toContain("from './filosofia-cards'")
    expect(home).toContain("from './podcast-featured'")
    expect(home).toMatch(/literaturaFeaturedWork\(\)/)
    expect(home).toMatch(/filosofiaFeaturedWork\(\)/)
    expect(home).toMatch(/voxFrancaisFeaturedEpisode\(\)/)
    expect(home.includes('pipeline-export-segments')).toBe(false)
  })

  test('pipeline card helpers expose only stable default pt editions', () => {
    for (const file of ['literatura-cards.ts', 'filosofia-cards.ts']) {
      const src = read(path.resolve(`.vitepress/theme/components/${file}`))
      for (const marker of ['WorkCards(', 'FeaturedWork():']) {
        const fn = src.slice(src.indexOf(marker), src.indexOf('\n}', src.indexOf(marker)))
        expect(fn, `${file} ${marker}`).toContain("work.routeStability !== 'stable'")
        expect(fn, `${file} ${marker}`).toContain('pt.default !== true')
      }
    }
  })

  test('pillars.ts stays pure IA data — no imports (no Vue, JSON, or pipeline-export dependency)', () => {
    const pillars = read(path.resolve('.vitepress/theme/components/pillars.ts'))
    expect(pillars).not.toMatch(/^\s*import\s/m)
    expect(pillars).not.toMatch(/from\s+['"][^'"]+\.vue['"]/)
    expect(pillars).not.toMatch(/from\s+['"][^'"]+\.json['"]/)
  })

  test('the built homepage carries one representative live preview without author/count bloat', () => {
    const html = read(path.join(DIST, 'index.html'))
    expect(html).toContain('pillar__live')
    expect(html).toContain('Memórias póstumas de Brás Cubas')
    expect(html).not.toContain('163 capítulos')
    expect(html).not.toContain('99 trechos')
    expect(html.includes('Louis Lavelle')).toBe(false)
    expect(html.includes('/louis-lavelle/')).toBe(false)
  })

  test('the homepage source stays a bounded gateway: no cards, no direct data import, no extra pillar route', () => {
    const home = read(path.resolve('.vitepress/theme/components/Home.vue'))
    expect(home).not.toContain('CardGrid')
    expect(home).not.toContain('VPFeature')
    expect(home).not.toContain('/podcast/')
    expect(home).toContain('PILLARS')
  })
})
