import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Slice 2A — generated local-nav manifest (docs/sidebar-local-nav-model.md §4).
// DATA FOUNDATION ONLY: nothing consumes sidebar-nav.json yet and config.ts remains the
// live sidebar source, so this slice changes no visible navigation. These tests lock the
// manifest's contract + determinism and that it is not yet wired into the UI.
const DIST = path.resolve('.vitepress/dist')
const MANIFEST = path.resolve('.vitepress/theme/data/sidebar-nav.json')

const manifest = () => JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'))
const corpus = (m: any, key: string) => m.corpora.find((c: any) => c.key === key)

function allWorks(m: any): any[] {
  const out: any[] = []
  for (const c of m.corpora) {
    for (const a of c.authors ?? []) out.push(...a.works)
    for (const g of c.groups ?? []) out.push(...g.works)
  }
  return out
}

// Resolve a site href to its built HTML file (cleanUrls: dirs -> index.html, leaves -> .html).
function builtExists(href: string): boolean {
  if (href.endsWith('/')) return fs.existsSync(path.join(DIST, href, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${href}.html`)) ||
    fs.existsSync(path.join(DIST, href, 'index.html'))
  )
}

test.describe('sidebar-nav manifest (Slice 2A data foundation)', () => {
  test('builds deterministically and is idempotent', () => {
    const out = execFileSync('python3', ['scripts/build-sidebar-nav.py'], {
      encoding: 'utf-8'
    }).trim()
    expect(out).toBe('No sidebar-nav changes.')
  })

  test('corpora are present in the user-facing (global-nav) order', () => {
    // the legacy louis-lavelle corpus was removed in A5; literatura + podcast remain
    expect(manifest().corpora.map((c: any) => c.key)).toEqual(['literatura', 'podcast'])
  })

  test('single-file works are classified single-file; multi-leaf works carry a leaf count', () => {
    const byHref: Record<string, any> = Object.fromEntries(
      allWorks(manifest()).map((w) => [w.href, w])
    )
    for (const href of [
      '/literatura/machado-de-assis/a-cartomante',
      '/literatura/raul-pompeia/o-ateneu'
    ]) {
      expect(byHref[href], href).toBeTruthy()
      expect(byHref[href].kind, href).toBe('single-file')
      expect(byHref[href].leaves, href).toBe(0)
    }
    for (const href of [
      '/literatura/graciliano-ramos/vidas-secas',
      '/literatura/machado-de-assis/bras-cubas'
    ]) {
      expect(byHref[href], href).toBeTruthy()
      expect(byHref[href].kind, href).toBe('multi-leaf')
      expect(byHref[href].leaves, href).toBeGreaterThan(0)
    }
    // (the pipeline pt work moved to /pt/filosofia/... in A2 and is no longer in the louis-lavelle
    // corpus; A3 adds its locale-rooted nav/sidebar entry, with pipeline-export classification.)
  })

  // (The Lavelle translated/original corpus test was retired in A5 with the legacy /louis-lavelle/
  // corpus; the locale-rooted pt Introdução is a hand-authored /pt/filosofia/ hub, not a sidebar-nav corpus.)

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
    // the hand-maintained rented sidebar object is unchanged and still live
    expect(config).toContain("'/literatura/':")
    expect(config).toContain("'/podcast/':")
    expect(config.includes("'/louis-lavelle/':")).toBe(false) // legacy sidebar key removed in A5
    // the rented sidebar (config.ts) is NOT fed by the manifest
    expect(config).not.toContain('sidebar-nav')
    // the manifest's only .vitepress consumer is the owned PodcastEpisodeNav (Slice 2B);
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
