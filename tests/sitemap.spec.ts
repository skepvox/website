import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Sitemap de-emphasis: chapter/leaf pages are dropped from the sitemap but stay
// indexable (no robots noindex) and locally searchable (search config untouched),
// while hubs and work pages remain. File-based against the built sitemap; needs a
// prior build (pnpm build / pnpm podcast:build).
test.describe('sitemap de-emphasis', () => {
  const ORIGIN = 'https://www.skepvox.com'
  const sitemapUrls = () =>
    new Set(
      [
        ...fs
          .readFileSync(path.resolve('.vitepress/dist/sitemap.xml'), 'utf-8')
          .matchAll(/<loc>([^<]+)<\/loc>/g)
      ].map((m) => m[1].replace(ORIGIN, ''))
    )

  test('keeps hubs, author/work hubs (incl. single-file works), podcast hub/series/episode', () => {
    const urls = sitemapUrls()
    for (const u of [
      '/',
      '/podcast/',
      '/podcast/francais/',
      '/podcast/francais/001-le-badge',
      '/literatura/',
      '/literatura/machado-de-assis/',
      '/literatura/machado-de-assis/dom-casmurro', // multi-chapter work hub
      '/literatura/machado-de-assis/o-alienista', // single-file work (depth edge case)
      '/literatura/raul-pompeia/o-ateneu', // single-file work
      '/louis-lavelle/',
      '/louis-lavelle/de-l-etre' // lavelle work
    ]) {
      expect(urls, `${u} should be in the sitemap`).toContain(u)
    }
  })

  test('drops chapter routes, /404, and the buffer page', () => {
    const urls = sitemapUrls()
    for (const u of [
      '/literatura/machado-de-assis/dom-casmurro/00-01-001-do-titulo', // chapter under a multi-chapter work
      '/louis-lavelle/de-l-etre/00-00-001-de-la-primaute-de-l-etre', // chapter under a kept lavelle work
      '/404',
      '/podcast/francais/003-le-covoiturage-poli' // buffer page
    ]) {
      expect(urls, `${u} should NOT be in the sitemap`).not.toContain(u)
    }
  })

  test('a dropped chapter stays indexable (no robots noindex meta)', () => {
    for (const rel of [
      'literatura/machado-de-assis/dom-casmurro/00-01-001-do-titulo.html',
      'louis-lavelle/de-l-etre/00-00-001-de-la-primaute-de-l-etre.html'
    ]) {
      const html = fs.readFileSync(path.resolve('.vitepress/dist', rel), 'utf-8')
      expect(html, `${rel} must remain indexable`).not.toContain('name="robots"')
    }
  })

  test('chapter pages are not excluded from local search (search config untouched)', () => {
    // Local-search inclusion is governed by `search: false` frontmatter, used only
    // on buffer pages. Chapter sources carry no such flag, so they stay in the
    // local index; this slice changes only the sitemap, never search config.
    const src = fs.readFileSync(
      path.resolve('src/literatura/machado-de-assis/dom-casmurro/00-01-001-do-titulo.md'),
      'utf-8'
    )
    expect(src).not.toMatch(/^search:\s*false/m)
  })
})
