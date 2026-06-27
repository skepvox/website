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
      '/podcast/francais/003-le-covoiturage-poli',
      '/pt/literatura/', // locale-rooted literatura section hub (B2; legacy /literatura/ retired in B5)
      '/pt/literatura/machado-de-assis/', // author hub
      '/pt/literatura/machado-de-assis/bras-cubas/', // pipeline pt work hub
      '/pt/filosofia/', // locale-rooted philosophy section hub (A3; replaces the legacy /louis-lavelle/ removed in A5)
      '/pt/filosofia/louis-lavelle/', // locale-rooted author hub (A3)
      '/pt/filosofia/louis-lavelle/introducao-a-ontologia/' // locale-rooted pipeline work hub (A2)
    ]) {
      expect(urls, `${u} should be in the sitemap`).toContain(u)
    }
  })

  test('drops chapter routes and /404', () => {
    const urls = sitemapUrls()
    for (const u of [
      '/pt/literatura/machado-de-assis/bras-cubas/00-00-001-004', // pipeline pt leaf (B2/B3) — pruned
      '/pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008', // locale-rooted pipeline leaf (A2)
      '/404'
    ]) {
      expect(urls, `${u} should NOT be in the sitemap`).not.toContain(u)
    }
  })

  test('a dropped chapter stays indexable (no robots noindex meta)', () => {
    for (const rel of ['pt/literatura/machado-de-assis/bras-cubas/00-00-001-004.html']) {
      const html = fs.readFileSync(path.resolve('.vitepress/dist', rel), 'utf-8')
      expect(html, `${rel} must remain indexable`).not.toContain('name="robots"')
    }
  })

  test('chapter pages are not excluded from local search (search config untouched)', () => {
    // Local-search inclusion is governed by `search: false` frontmatter, used only on hidden/buffer
    // pages. A published reading leaf carries no such flag, so it stays in the local index; this guard
    // changes only the sitemap, never search config.
    const src = fs.readFileSync(
      path.resolve('src/pt/literatura/machado-de-assis/bras-cubas/00-00-001-004.md'),
      'utf-8'
    )
    expect(src).not.toMatch(/^search:\s*false/m)
  })
})
