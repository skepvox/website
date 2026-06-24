import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

// Slice 2I — old->new 301 redirect-map artifact for the 12 live fr chapter URLs of Introdução à
// ontologia. DATA/DOC ONLY: the map is NOT wired into any redirect channel (status:"not-enabled",
// no src/public/_redirects). See docs/introduction-a-ontologia-live-migration-plan.md §6/§8.
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const ARTIFACT = path.resolve(
  '.vitepress/theme/data/pipeline-redirect-map-introduction-a-l-ontologie.json'
)
const SCRIPT = path.resolve('scripts/build-pipeline-redirect-map.py')
const REDIRECTS = path.resolve('src/public/_redirects')

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const map = () => read(ARTIFACT)

function builtExists(href: string): boolean {
  if (href.endsWith('/')) return fs.existsSync(path.join(DIST, href, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${href}.html`)) ||
    fs.existsSync(path.join(DIST, href, 'index.html'))
  )
}

const chapterPrefix = (s: string) => s.split('-').slice(0, 3).join('-')

test.describe('pipeline-export redirect map (Slice 2I, data/doc only, not enabled)', () => {
  test('the generator is deterministic / idempotent', () => {
    const before = fs.readFileSync(ARTIFACT, 'utf-8')
    const out = execFileSync('python3', [SCRIPT], { encoding: 'utf-8' })
    const after = fs.readFileSync(ARTIFACT, 'utf-8')
    expect(after).toBe(before)
    expect(out).toContain('No redirect-map changes.')
  })

  test('the artifact has the right shape: schema, source, not-enabled, 12 entries, all 301', () => {
    const m = map()
    expect(m.$schema).toBe('skepvox-pipeline-redirect-map-v1')
    expect(m.source).toBe('pipeline-export')
    expect(m.status).toBe('not-enabled')
    expect(m.work.edition).toBe('fr')
    expect(m.entries.length).toBe(12)
    expect(m.entries.every((e: any) => e.statusCode === 301)).toBe(true)
    expect(
      m.entries.every(
        (e: any) => e.oldPath && e.targetPath && e.chapterPrefix && typeof e.note === 'string'
      )
    ).toBe(true)
  })

  test('every oldPath is a currently built/live chapter page', () => {
    for (const e of map().entries) expect(builtExists(e.oldPath), e.oldPath).toBe(true)
    // one entry per current chapter leaf, and they cover exactly the 12 leaves
    const stems = fs
      .readdirSync(path.resolve('src/louis-lavelle/introduction-a-l-ontologie'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
    expect(stems.length).toBe(12)
    const oldStems = map()
      .entries.map((e: any) => e.oldPath.split('/').pop())
      .sort()
    expect(oldStems).toEqual([...stems].sort())
  })

  test('every target is the first fr segment route of its BB-PP-CCC chapter', () => {
    const fr = read(META).segments.filter((s: any) => s.language === 'fr')
    const frRoutePaths = new Set(fr.map((s: any) => `/${s.routePath}`))
    // recompute first segment per chapter (lowest SSS) independently of the generator
    const firstByChapter: Record<string, any> = {}
    for (const s of fr) {
      const cp = chapterPrefix(s.segmentPrefix)
      if (!firstByChapter[cp] || s.segmentPrefix < firstByChapter[cp].segmentPrefix)
        firstByChapter[cp] = s
    }
    for (const e of map().entries) {
      expect(frRoutePaths.has(e.targetPath), `${e.targetPath} in fr routePaths`).toBe(true)
      expect(e.targetPath).toBe(`/${firstByChapter[e.chapterPrefix].routePath}`)
      expect(chapterPrefix(e.oldPath.split('/').pop())).toBe(e.chapterPrefix)
    }
  })

  test('front-matter (1:1) and conclusion (096 + new 097-099) notes are present', () => {
    const byPrefix: Record<string, any> = {}
    for (const e of map().entries) byPrefix[e.chapterPrefix] = e

    const front = byPrefix['00-00-000']
    expect(front.oldPath).toBe('/louis-lavelle/introduction-a-l-ontologie/00-00-000-avertissement')
    expect(front.targetPath).toBe(
      '/louis-lavelle/introduction-a-l-ontologie/00-00-000-001-avertissement'
    )
    expect(front.note).toMatch(/1:1/)

    const concl = byPrefix['99-99-999']
    expect(concl.targetPath).toBe(
      '/louis-lavelle/introduction-a-l-ontologie/99-99-999-096-paragraphe-95'
    )
    expect(concl.note).toContain('096')
    expect(concl.note).toMatch(/097-099/)
    expect(concl.note).toMatch(/no old-URL source/i)
  })

  test('redirects are NOT enabled and live behavior is unchanged', () => {
    // the map lives as data, not a redirect channel
    expect(fs.existsSync(REDIRECTS)).toBe(false)
    expect(map().status).toBe('not-enabled')
    // the artifact is a data file, not a built public page
    expect(builtExists('/pipeline-redirect-map-introduction-a-l-ontologie')).toBe(false)
    // the 12 live fr chapter routes (and hub) still resolve
    const work = '/louis-lavelle/introduction-a-l-ontologie'
    expect(builtExists(work)).toBe(true)
    for (const e of map().entries) expect(builtExists(e.oldPath), e.oldPath).toBe(true)
  })
})
