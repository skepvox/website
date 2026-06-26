import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

// Slice 2J/2L/2M — the real pt segment route family at its PUBLIC namespace, with REAL prose.
// docs/introduction-a-ontologia-live-migration-plan.md §4. The pipeline minted the pt edition; the 99
// pt pages are generated under src/pt/filosofia/louis-lavelle/introducao-a-ontologia/<routePath-leaf>.md with their
// REAL prose inlined as static Markdown (joined by segmentPrefix/language, never routePath). No
// indexable public page may be thin / review-only / missing prose. No redirects: A4 removed the fr->pt
// redirect map + src/public/_redirects (clean break); old /louis-lavelle/... URLs may 404.
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const PUBLIC_DIR = path.resolve('src/pt/filosofia/louis-lavelle/introducao-a-ontologia')
const GEN = path.resolve('scripts/build-pipeline-segment-routes.py')

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const ptSegments = () =>
  read(META).segments.filter(
    (s: any) => s.workId === 'louis-lavelle/introduction-a-l-ontologie' && s.language === 'pt'
  )
const publicRoute = (s: any) =>
  `/pt/filosofia/louis-lavelle/introducao-a-ontologia/${s.routePath.split('/').pop()}`
const pageBody = (text: string) => text.replace(/^---[\s\S]*?\n---\n/, '').trim()

function builtExists(href: string): boolean {
  if (href.endsWith('/')) return fs.existsSync(path.join(DIST, href, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${href}.html`)) ||
    fs.existsSync(path.join(DIST, href, 'index.html'))
  )
}

test.describe('pipeline pt segment route family (Slice 2M, public + real prose, no redirects / clean break)', () => {
  test('all 99 public pt pages build and carry real prose (none thin / review-only / noindex)', () => {
    const pt = ptSegments()
    expect(pt.length).toBe(99)
    const files = fs.readdirSync(PUBLIC_DIR).filter((f) => f.endsWith('.md') && f !== 'index.md')
    expect(files.length).toBe(99)
    for (const s of pt) expect(builtExists(publicRoute(s)), publicRoute(s)).toBe(true)

    for (const f of files) {
      const t = fs.readFileSync(path.join(PUBLIC_DIR, f), 'utf-8')
      // real prose body, not a thin/review stub
      expect(pageBody(t).length, `${f} body length`).toBeGreaterThan(200)
      // none of the review-only / publicly-wrong wording
      expect(t.includes('Prosa não vendorizada'), f).toBe(false)
      expect(t.includes('routePath'), f).toBe(false)
      expect(t.includes('QA (internal)'), f).toBe(false)
      expect(t.includes('noindex'), f).toBe(false)
      expect(t.includes('buffer: true'), f).toBe(false)
      // identity is carried as frontmatter (the join key), not routePath
      expect(t.includes('pipelineCanonicalId:'), f).toBe(true)
    }
  })

  test('the built public pages contain the real prose body, not a notice', () => {
    const html = fs.readFileSync(
      path.join(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.html'),
      'utf-8'
    )
    expect(html).toContain('na simples enunciação da palavra ser')
    expect(html).toContain('o ser é, o não-ser não é') // guillemet quote preserved
    expect(html).not.toContain('Prosa não vendorizada')
    expect(html).not.toMatch(/name="robots"[^>]*content="noindex"/)
  })

  test('the generator joins prose by (segmentPrefix, language) — never routePath — and hard-fails on missing prose', () => {
    const src = fs.readFileSync(GEN, 'utf-8')
    // join key is segmentPrefix + language; routePath is used only for the output filename
    expect(src).toContain("rec['segmentPrefix']")
    expect(src).toContain("rec['language']")
    expect(src).toMatch(/leaf = rec\["routePath"\]\.split/) // routePath -> filename only

    // a stable public page with no prose source must be a HARD failure (no fallback notice)
    const emptyProse = fs.mkdtempSync(path.join(os.tmpdir(), 'noprose-'))
    const r = spawnSync('python3', [GEN, '--dry-run', '--prose-root', emptyProse], {
      encoding: 'utf-8'
    })
    expect(r.status).not.toBe(0)
    expect(`${r.stderr}${r.stdout}`).toMatch(/missing prose|ERROR/)
  })

  test('no duplicate stable family under reading-review; the 4 demo pages remain (noindex)', () => {
    expect(fs.existsSync(path.resolve('src/reading-review/introducao-a-ontologia'))).toBe(false)
    expect(fs.existsSync(path.join(DIST, 'reading-review/introducao-a-ontologia'))).toBe(false)
    for (const demo of [
      'introduction-a-l-ontologie',
      'introduction-a-l-ontologie-segment',
      'introduction-a-l-ontologie-window',
      'introduction-a-l-ontologie-reader'
    ]) {
      expect(builtExists(`/reading-review/${demo}`), demo).toBe(true)
      const html = fs.readFileSync(path.join(DIST, `reading-review/${demo}.html`), 'utf-8')
      expect(html, demo).toMatch(/name="robots"[^>]*content="noindex"/)
    }
  })

  test('the legacy fr edition is gone (12 chapter pages + hub removed in A5); no redirect either (clean break)', () => {
    expect(fs.existsSync(path.resolve('src/louis-lavelle/introduction-a-l-ontologie'))).toBe(false)
    expect(builtExists('/louis-lavelle/introduction-a-l-ontologie')).toBe(false)
    expect(fs.existsSync(path.join(DIST, 'louis-lavelle'))).toBe(false)
    // clean break (A4): and no _redirects file exists either
    expect(fs.existsSync(path.resolve('src/public/_redirects'))).toBe(false)
  })

  test('a public page renders its real prose with no review wording', async ({ page }) => {
    await page.goto('/pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008')
    await expect(
      page.getByText('na simples enunciação da palavra ser', { exact: false })
    ).toBeVisible()
    await expect(page.getByText('Prosa não vendorizada')).toHaveCount(0)
    await expect(page.getByText('QA (internal)')).toHaveCount(0)
  })
})
