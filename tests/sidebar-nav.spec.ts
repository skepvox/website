import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Generated local-nav manifest.
// DATA FOUNDATION ONLY: nothing consumes sidebar-nav.json yet and config.ts remains the
// live sidebar source, so no visible navigation changes. These tests lock the
// manifest's contract + determinism and that it is not yet wired into the UI.
const DIST = path.resolve('.vitepress/dist')
const MANIFEST = path.resolve('.vitepress/theme/data/sidebar-nav.json')

const manifest = () => JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'))
const corpus = (m: any, key: string) => m.corpora.find((c: any) => c.key === key)

// Resolve a site href to its built HTML file (cleanUrls: dirs -> index.html, leaves -> .html).
function builtExists(href: string): boolean {
  if (href.endsWith('/')) return fs.existsSync(path.join(DIST, href, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${href}.html`)) ||
    fs.existsSync(path.join(DIST, href, 'index.html'))
  )
}

test.describe('sidebar-nav manifest (data foundation)', () => {
  test('builds deterministically and is idempotent', () => {
    const out = execFileSync('python3', ['scripts/build-sidebar-nav.py'], {
      encoding: 'utf-8'
    }).trim()
    expect(out).toBe('No sidebar-nav changes.')
  })

  test('corpora are present in the user-facing (global-nav) order', () => {
    // the legacy louis-lavelle corpus was removed in A5; the hand-authored /literatura/ corpus in B5
    // (Brás Cubas is now a /pt/literatura/ pipeline reader hub, not a sidebar-nav corpus). Podcast remains.
    expect(manifest().corpora.map((c: any) => c.key)).toEqual(['podcast'])
  })

  test('no buffer/private podcast episodes leak: per-show count matches the public manifest', () => {
    const shows = JSON.parse(fs.readFileSync(path.resolve('src/podcast/shows.json'), 'utf-8'))
    const publicCount: Record<string, number> = Object.fromEntries(
      shows.map((s: any) => [s.href, s.episodeCount])
    )
    for (const show of corpus(manifest(), 'podcast').shows) {
      expect(show.episodes.length, show.title).toBe(show.episodeCount)
      expect(show.episodeCount, show.title).toBe(publicCount[show.href])
    }
  })

  test('every generated href resolves to a built page', () => {
    const m = manifest()
    const hrefs = new Set<string>()
    for (const c of m.corpora) {
      hrefs.add(c.route)
      for (const a of c.authors ?? []) {
        hrefs.add(a.route)
        a.works.forEach((w: any) => hrefs.add(w.href))
      }
      for (const g of c.groups ?? []) g.works.forEach((w: any) => hrefs.add(w.href))
      for (const s of c.shows ?? []) {
        hrefs.add(s.href)
        s.episodes.forEach((e: any) => hrefs.add(e.href))
      }
    }
    const missing = [...hrefs].filter((h) => !builtExists(h))
    expect(missing, `unresolved hrefs: ${missing.join(', ')}`).toEqual([])
  })

  test('config.ts remains the live rented-sidebar source; manifest feeds only owned components', () => {
    const config = fs.readFileSync(path.resolve('.vitepress/config.ts'), 'utf-8')
    // the hand-maintained rented sidebar object is still live; podcast only since B5
    expect(config).toContain("'/podcast/':")
    expect(config.includes("'/louis-lavelle/':")).toBe(false) // legacy sidebar key removed in A5
    expect(config.includes("'/literatura/':")).toBe(false) // legacy literatura sidebar removed in B5
    // the rented sidebar (config.ts) is NOT fed by the manifest
    expect(config).not.toContain('sidebar-nav')
    // the manifest's only .vitepress consumer is the owned PodcastEpisodeNav;
    // it is never wired into config.ts or the rented VPSidebar.
    const consumers: string[] = []
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['data', 'dist', 'cache'].includes(e.name)) continue
        const p = path.join(dir, e.name)
        if (e.isDirectory()) walk(p)
        else if (
          /\.(ts|vue|js|mjs)$/.test(e.name) &&
          fs.readFileSync(p, 'utf-8').includes('sidebar-nav')
        )
          consumers.push(path.relative(path.resolve('.vitepress'), p))
      }
    }
    walk(path.resolve('.vitepress'))
    expect(consumers.sort()).toEqual(['theme/components/PodcastEpisodeNav.vue'])
  })
})
