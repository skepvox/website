import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

// Slice 2N (go-live) — the old->new 301 redirect map is now ENABLED: src/public/_redirects maps the 12
// old fr chapter URLs to the FIRST PT segment of each chapter (the now-public canonical edition), never
// to an unbuilt fr segment route. The artifact encodes the source/target decision (sourceLanguage fr ->
// targetLanguage pt, targetEdition canonical). routePath is presentation; identity is canonicalId.
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
const pageBody = (text: string) => text.replace(/^---[\s\S]*?\n---\n/, '').trim()

test.describe('pipeline-export redirect map (Slice 2N, ENABLED, fr chapter -> pt segment)', () => {
  test('the generator is deterministic / idempotent', () => {
    const before = fs.readFileSync(ARTIFACT, 'utf-8')
    const out = execFileSync('python3', [SCRIPT], { encoding: 'utf-8' })
    expect(fs.readFileSync(ARTIFACT, 'utf-8')).toBe(before)
    expect(out).toContain('No redirect-map changes.')
  })

  test('the artifact is enabled and encodes the source(fr)->target(pt canonical) decision', () => {
    const m = map()
    expect(m.$schema).toBe('skepvox-pipeline-redirect-map-v1')
    expect(m.source).toBe('pipeline-export')
    expect(m.status).toBe('enabled')
    expect(m.work.sourceLanguage).toBe('fr')
    expect(m.work.targetLanguage).toBe('pt')
    expect(m.work.targetEdition).toBe('canonical')
    expect(m.entries.length).toBe(12)
    expect(m.entries.every((e: any) => e.statusCode === 301)).toBe(true)
  })

  test('src/public/_redirects exists with exactly the 12 expected 301 mappings', () => {
    expect(fs.existsSync(REDIRECTS)).toBe(true)
    const lines = fs
      .readFileSync(REDIRECTS, 'utf-8')
      .split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('#'))
    expect(lines.length).toBe(12)
    // each line: "<oldPath>  <targetPath>  301", matching the artifact exactly
    const fromFile = lines
      .map((l) => {
        const [oldPath, targetPath, code] = l.trim().split(/\s+/)
        return { oldPath, targetPath, code }
      })
      .sort((a, b) => a.oldPath.localeCompare(b.oldPath))
    const fromMap = map()
      .entries.map((e: any) => ({
        oldPath: e.oldPath,
        targetPath: e.targetPath,
        code: String(e.statusCode)
      }))
      .sort((a: any, b: any) => a.oldPath.localeCompare(b.oldPath))
    expect(fromFile).toEqual(fromMap)
    for (const r of fromFile) {
      expect(r.code).toBe('301')
      expect(r.oldPath.startsWith('/louis-lavelle/introduction-a-l-ontologie/')).toBe(true)
      expect(r.targetPath.startsWith('/louis-lavelle/introducao-a-ontologia/')).toBe(true)
    }
  })

  test('every redirect TARGET is the first pt segment of its chapter — a built pt page with real prose', () => {
    const pt = read(META).segments.filter((s: any) => s.language === 'pt')
    const ptRoutePaths = new Set(pt.map((s: any) => `/${s.routePath}`))
    const firstByChapter: Record<string, any> = {}
    for (const s of pt) {
      const cp = chapterPrefix(s.segmentPrefix)
      if (!firstByChapter[cp] || s.segmentPrefix < firstByChapter[cp].segmentPrefix)
        firstByChapter[cp] = s
    }
    for (const e of map().entries) {
      // target is a real pt routePath (never an unbuilt fr segment route)
      expect(ptRoutePaths.has(e.targetPath), `${e.targetPath} is a pt routePath`).toBe(true)
      expect(e.targetPath).toBe(`/${firstByChapter[e.chapterPrefix].routePath}`)
      expect(chapterPrefix(e.oldPath.split('/').pop())).toBe(e.chapterPrefix)
      // the target is a BUILT page...
      expect(builtExists(e.targetPath), `${e.targetPath} built`).toBe(true)
      // ...with real prose (not thin / not a notice)
      const leaf = e.targetPath.split('/').pop()
      const src = fs.readFileSync(
        path.resolve('src/louis-lavelle/introducao-a-ontologia', `${leaf}.md`),
        'utf-8'
      )
      expect(pageBody(src).length, `${leaf} prose`).toBeGreaterThan(200)
      expect(src.includes('Prosa não vendorizada')).toBe(false)
    }
  })

  test('no redirect target points to an unbuilt fr segment route', () => {
    for (const e of map().entries) {
      expect(e.targetPath.startsWith('/louis-lavelle/introduction-a-l-ontologie/')).toBe(false)
      expect(builtExists(e.targetPath)).toBe(true)
    }
  })

  test('every oldPath is a still-built fr chapter page (kept as a redirect source)', () => {
    for (const e of map().entries) expect(builtExists(e.oldPath), e.oldPath).toBe(true)
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
})
