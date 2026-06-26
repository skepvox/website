import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Reading-app Slice a — provisional segment-manifest (docs/reading-app-segment-workhub-assessment.md).
// DATA FOUNDATION ONLY: establishes durable per-segment identity (canonicalId) + a conservative
// authored hierarchy (groupPath) from committed website data, wired into no component. These tests
// lock identity, ordering, coverage, classification, and that it is not yet consumed by the UI.
const DIST = path.resolve('.vitepress/dist')
const SRC = path.resolve('src')
const MANIFEST = path.resolve('.vitepress/theme/data/segment-manifest.json')
const READING_NAV = path.resolve('.vitepress/theme/data/reading-nav.json')

const manifest = () => JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'))
const readingNav = () => JSON.parse(fs.readFileSync(READING_NAV, 'utf-8'))

// cleanUrls: dir routes -> index.html, leaf routes -> <href>.html
function builtExists(href: string): boolean {
  if (href.endsWith('/')) return fs.existsSync(path.join(DIST, href, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${href}.html`)) ||
    fs.existsSync(path.join(DIST, href, 'index.html'))
  )
}
const seg = (workId: string) => manifest().segments.filter((s: any) => s.workId === workId)

test.describe('segment-manifest (reading-app Slice a data foundation)', () => {
  test('builds deterministically and is idempotent', () => {
    const out = execFileSync('python3', ['scripts/build-segment-manifest.py'], {
      encoding: 'utf-8'
    }).trim()
    expect(out).toBe('No segment-manifest changes.')
  })

  test('covers every reading-nav leaf exactly (plus single-file works)', () => {
    const rn = readingNav()
    const m = manifest()
    const expected: string[] = []
    for (const route of Object.keys(rn)) {
      for (const [slug] of rn[route]) expected.push(`${route}/${slug}`)
    }
    const hrefs = new Set(m.segments.map((s: any) => s.href))
    const missing = expected.filter((h) => !hrefs.has(h))
    expect(missing, `uncovered reading-nav leaves: ${missing.slice(0, 5).join(', ')}`).toEqual([])
    // multi-leaf segment count == reading-nav total; single-file are the only extras
    const multi = m.segments.filter((s: any) => s.prefixCompatibility !== 'single-file')
    expect(multi.length).toBe(expected.length)
  })

  test('every relativePath exists and every href resolves to a built page', () => {
    const m = manifest()
    const records = [...m.works, ...m.segments]
    const missingSrc = records.filter((r: any) => !fs.existsSync(path.join(SRC, r.relativePath)))
    expect(missingSrc.map((r: any) => r.relativePath)).toEqual([])
    const missingBuilt = records.filter((r: any) => !builtExists(r.href))
    expect(missingBuilt.map((r: any) => r.href)).toEqual([])
    expect(m.works.map((w: any) => w.href)).not.toContain(
      '/pt/filosofia/louis-lavelle/introducao-a-ontologia'
    )
  })

  test('canonicalId is unique, never a route href, and never a raw route slug', () => {
    const segs = manifest().segments
    const ids = segs.map((s: any) => s.canonicalId)
    expect(new Set(ids).size, 'canonicalId collisions').toBe(ids.length)
    for (const s of segs) {
      expect(s.canonicalId, s.href).not.toBe(s.href)
      expect(s.canonicalId.startsWith('/'), `${s.canonicalId} must not look like a route`).toBe(
        false
      )
      expect(s.canonicalId, s.canonicalId).not.toBe(s.slug)
    }
  })

  test('segment order matches reading-nav order per work', () => {
    const rn = readingNav()
    const segs = manifest().segments
    for (const route of Object.keys(rn)) {
      const expected = rn[route].map(([slug]: [string]) => `${route}/${slug}`)
      const got = segs
        .filter((s: any) => s.href.startsWith(`${route}/`))
        .sort((a: any, b: any) => a.order - b.order)
        .map((s: any) => s.href)
      expect(got, route).toEqual(expected)
    }
  })

  test('groupPath exists on every segment with absent levels omitted (no null-fill)', () => {
    for (const s of manifest().segments) {
      expect(Array.isArray(s.groupPath), s.canonicalId).toBe(true)
      for (const level of s.groupPath) {
        expect(level, s.canonicalId).not.toBeNull()
        expect(typeof level.kind, s.canonicalId).toBe('string')
        expect(typeof level.index, s.canonicalId).toBe('number')
      }
      // a chapter-level leaf IS its own chapter, so the chapter is never a level above it
      if (s.prefixCompatibility === 'chapter-level') {
        expect(
          s.groupPath.some((l: any) => l.kind === 'chapter'),
          s.canonicalId
        ).toBe(false)
      }
    }
  })

  // Readiness for a v1 collapsible WorkContents (collapse/local-state come in Slice b, NOT here):
  // each group level must expose a stable key derived from work + index path, shared by every
  // segment in that group, so group headers / aria-controls / collapse keys need no slug parsing.
  test('groupPath levels carry a stable group key (work + index path), shared within a group', () => {
    const segs = manifest().segments
    const keyMembers: Record<string, Set<string>> = {}
    for (const s of segs) {
      for (const level of s.groupPath) {
        expect(typeof level.key, s.canonicalId).toBe('string')
        expect(level.key.startsWith(s.workId), `${level.key} under ${s.workId}`).toBe(true)
        ;(keyMembers[level.key] ??= new Set()).add(s.workId)
      }
    }
    // a group key never spans two works (stable + unambiguous group identity)
    const cross = Object.entries(keyMembers).filter(([, works]) => works.size > 1)
    expect(cross.map(([k]) => k)).toEqual([])
    // (The concrete grouped examples — louis-lavelle/a-consciencia-de-si chapter keys + de-l-acte book
    // keys — were retired in A5 with the legacy corpus; no current literatura work is authored-grouped.)
  })

  test('legacy chapter-level and single-file leaves are represented and classified', () => {
    const m = manifest()
    const byId = Object.fromEntries(m.works.map((w: any) => [w.workId, w]))

    // chapter-level legacy work: chapter == segment, no SSS, no chapter in groupPath
    expect(byId['machado-de-assis/bras-cubas'].prefixCompatibility).toBe('chapter-level')
    const bc = seg('machado-de-assis/bras-cubas')
    expect(bc.length).toBeGreaterThan(100)
    expect(bc.every((s: any) => s.segmentKind === 'chapter')).toBe(true)
    expect(bc.every((s: any) => s.segmentIndex === undefined)).toBe(true)

    // (The segment-level + inferred-book examples were louis-lavelle/a-consciencia-de-si and de-l-acte,
    // retired in A5 with the legacy corpus; literatura works are all chapter-level/flat, so no current
    // work exercises the segment-level / inferred-book classification paths.)

    // single-file works present and classified
    const sf = m.segments.filter((s: any) => s.prefixCompatibility === 'single-file')
    expect(sf.map((s: any) => s.canonicalId).sort()).toEqual([
      'machado-de-assis/a-cartomante',
      'raul-pompeia/o-ateneu'
    ])
    expect(sf.every((s: any) => s.segmentKind === 'single-file' && s.groupPath.length === 0)).toBe(
      true
    )
  })

  test('the manifest carries no prose and uses the website-committed source marker', () => {
    const m = manifest()
    expect(m.source).toBe('website-committed')
    // no record carries a prose/body/description/text field
    const prosey = [...m.works, ...m.segments].filter((r: any) =>
      ['body', 'prose', 'text', 'content', 'description', 'excerpt'].some((k) => k in r)
    )
    expect(prosey).toEqual([])
  })

  test('every work carries a base language for label localization', () => {
    const works = manifest().works
    expect(works.every((w: any) => ['pt', 'fr', 'en'].includes(w.language))).toBe(true)
    const byId = Object.fromEntries(works.map((w: any) => [w.workId, w.language]))
    // (the louis-lavelle fr/pt language examples were removed in A5; literatura is pt)
    expect(byId['machado-de-assis/bras-cubas']).toBe('pt')
  })

  test('the manifest is consumed only by the owned WorkContents book map (Slice b)', () => {
    const consumers: string[] = []
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['data', 'dist', 'cache'].includes(e.name)) continue
        const p = path.join(dir, e.name)
        if (e.isDirectory()) walk(p)
        else if (
          /\.(ts|vue|js|mjs)$/.test(e.name) &&
          fs.readFileSync(p, 'utf-8').includes('segment-manifest')
        )
          consumers.push(path.relative(path.resolve('.vitepress'), p))
      }
    }
    walk(path.resolve('.vitepress'))
    expect(consumers.sort()).toEqual([
      'theme/components/WorkContents.vue',
      'theme/components/WorkContentsMount.vue'
    ])
  })
})
