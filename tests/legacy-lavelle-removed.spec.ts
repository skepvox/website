import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice A5 / IA-5 — the legacy locale-less Louis Lavelle corpus is removed. The ONLY Lavelle surface is
// the new /pt/filosofia/louis-lavelle/ hub + the live pt Introdução à ontologia reader; old /louis-lavelle/
// URLs 404 (clean break, no redirects). File-based against src + the built dist (needs a prior build).
const DIST = path.resolve('.vitepress/dist')
const SRC = path.resolve('src')
const ORIGIN = 'https://www.skepvox.com'

// A LEGACY route is /louis-lavelle/... (locale-less). The live route is /pt/filosofia/louis-lavelle/...,
// which contains "louis-lavelle/" only as a substring after the locale-rooted prefix.
const isLegacyLavelle = (u: string) => /^\/louis-lavelle\//.test(u)
const hasLegacyLavellePath = (s: string) => /(?<!pt\/filosofia\/)louis-lavelle\//.test(s)

test.describe('legacy Lavelle corpus removed (slice A5 / IA-5)', () => {
  test('no source remains: src/louis-lavelle/ tree, build-lavelle-* scripts, legacy spec, orphan images are gone', () => {
    expect(fs.existsSync(path.join(SRC, 'louis-lavelle'))).toBe(false)
    expect(fs.existsSync(path.resolve('tests/louis-lavelle.spec.ts'))).toBe(false)
    const lavelleBuilders = fs
      .readdirSync(path.resolve('scripts'))
      .filter((f) => /^build-lavelle-/.test(f))
    expect(lavelleBuilders).toEqual([])
    // the orphaned legacy image dir is gone; the new hub's author portrait is kept
    expect(fs.existsSync(path.join(SRC, 'public/images/louis-lavelle'))).toBe(false)
    expect(fs.existsSync(path.join(SRC, 'public/images/authors/louis-lavelle.webp'))).toBe(true)
  })

  test('no built page exists under dist/louis-lavelle/', () => {
    expect(fs.existsSync(path.join(DIST, 'louis-lavelle'))).toBe(false)
  })

  test('config.ts has no nav/sidebar/route link to the legacy /louis-lavelle/ (Filosofia stays)', () => {
    const config = fs.readFileSync(path.resolve('.vitepress/config.ts'), 'utf-8')
    expect(config.includes("'/louis-lavelle/'")).toBe(false) // nav link + sidebar key literal
    expect(config.includes("link: '/louis-lavelle/")).toBe(false)
    expect(config.includes("activeMatch: '^/louis-lavelle/'")).toBe(false)
    expect(/segments\[0\]\s*===\s*'louis-lavelle'/.test(config)).toBe(false) // dead isChapterRoute rule
    expect(config).toContain("link: '/pt/filosofia/'") // the new Filosofia section nav stays
  })

  test('no sitemap URL is a legacy /louis-lavelle/ route (the new /pt/filosofia/louis-lavelle/ stays)', () => {
    const urls = [
      ...fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8').matchAll(/<loc>([^<]+)<\/loc>/g)
    ].map((m) => m[1].replace(ORIGIN, ''))
    expect(urls.filter(isLegacyLavelle)).toEqual([])
    expect(urls).toContain('/pt/filosofia/louis-lavelle/') // the new author hub stays indexed
  })

  test('no LLM output advertises a legacy /louis-lavelle/ path (the canonical pt edition is fine)', () => {
    for (const f of ['llms.txt', 'llms-full.txt']) {
      const p = path.join(DIST, f)
      if (!fs.existsSync(p)) continue
      expect(hasLegacyLavellePath(fs.readFileSync(p, 'utf-8')), f).toBe(false)
      // the legacy fr edition slug must be entirely gone from the LLM output
      expect(fs.readFileSync(p, 'utf-8').includes('introduction-a-l-ontologie'), f).toBe(false)
    }
  })

  test('no homepage or structured-data URL points to the legacy /louis-lavelle/', () => {
    const home = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8')
    expect(home.includes('skepvox.com/louis-lavelle/')).toBe(false) // JSON-LD
    expect(home.includes('href="/louis-lavelle/"')).toBe(false) // the visible pillar
    expect(home.includes('href="/pt/filosofia/louis-lavelle/"')).toBe(true) // retargeted to the live hub
  })

  test('the new Lavelle surface survives: /pt/filosofia/louis-lavelle/ builds and links to Introdução', () => {
    const hub = fs.readFileSync(path.join(DIST, 'pt/filosofia/louis-lavelle/index.html'), 'utf-8')
    expect(hub).toContain('href="/pt/filosofia/louis-lavelle/introducao-a-ontologia/"')
    expect(
      fs.existsSync(path.join(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/index.html'))
    ).toBe(true)
    expect(
      fs.existsSync(
        path.join(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.html')
      )
    ).toBe(true)
  })
})
