import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice 2J/2L — the real pt segment route family, now at its PUBLIC namespace.
// docs/introduction-a-ontologia-live-migration-plan.md §4. The pipeline minted the pt edition
// (urlStability:stable + publicSlug), so the 99 pt pages are generated under
// src/louis-lavelle/introducao-a-ontologia/<routePath-leaf>.md and are indexable. The earlier HIDDEN
// duplicate under reading-review/ is removed. routePath is presentation; canonicalId is identity.
// Redirects from the old fr chapter URLs are NOT enabled yet (go-live is one slice away).
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const PUBLIC_DIR = path.resolve('src/louis-lavelle/introducao-a-ontologia')
const REDIRECTS = path.resolve('src/public/_redirects')

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const ptSegments = () => read(META).segments.filter((s: any) => s.language === 'pt')
const publicRoute = (s: any) =>
  `/louis-lavelle/introducao-a-ontologia/${s.routePath.split('/').pop()}`

function builtExists(href: string): boolean {
  if (href.endsWith('/')) return fs.existsSync(path.join(DIST, href, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${href}.html`)) ||
    fs.existsSync(path.join(DIST, href, 'index.html'))
  )
}

test.describe('pipeline pt segment route family (Slice 2J/2L, public namespace, not yet redirected)', () => {
  test('all 99 pt segment pages build at the public namespace, one per segment', () => {
    const pt = ptSegments()
    expect(pt.length).toBe(99)
    for (const s of pt) expect(builtExists(publicRoute(s)), publicRoute(s)).toBe(true)
    const files = fs.readdirSync(PUBLIC_DIR).filter((f) => f.endsWith('.md'))
    expect(files.length).toBe(99)
    for (const f of files) {
      const t = fs.readFileSync(path.join(PUBLIC_DIR, f), 'utf-8')
      expect(t).toContain('generated: pipeline-segment-routes')
      expect(t).toContain('pipelineCanonicalId:') // (canonicalId, language) join key, not routePath
    }
  })

  test('the earlier HIDDEN reading-review pt family is gone (no duplicate route family)', () => {
    expect(fs.existsSync(path.resolve('src/reading-review/introducao-a-ontologia'))).toBe(false)
    expect(fs.existsSync(path.join(DIST, 'reading-review/introducao-a-ontologia'))).toBe(false)
    // the 4 hand-written demo pages still exist (kept, noindex/unlisted)
    for (const demo of [
      'introduction-a-l-ontologie',
      'introduction-a-l-ontologie-segment',
      'introduction-a-l-ontologie-window',
      'introduction-a-l-ontologie-reader'
    ]) {
      expect(builtExists(`/reading-review/${demo}`), demo).toBe(true)
    }
  })

  test('the 12 live fr chapter routes (and the hub) still resolve before redirects are enabled', () => {
    const work = '/louis-lavelle/introduction-a-l-ontologie'
    expect(builtExists(work)).toBe(true)
    const stems = fs
      .readdirSync(path.resolve('src/louis-lavelle/introduction-a-l-ontologie'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
    expect(stems.length).toBe(12)
    for (const stem of stems) expect(builtExists(`${work}/${stem}`), stem).toBe(true)
  })

  test('redirects are NOT enabled (no _redirects, redirect-map still not-enabled)', () => {
    expect(fs.existsSync(REDIRECTS)).toBe(false)
    const rmap = read(
      path.resolve('.vitepress/theme/data/pipeline-redirect-map-introduction-a-l-ontologie.json')
    )
    expect(rmap.status).toBe('not-enabled')
  })

  test('routePath is presentation only: pages join by (canonicalId, language); the component emits no anchors', async ({
    page
  }) => {
    const comp = fs.readFileSync(
      path.resolve('.vitepress/theme/components/PipelineSegmentRoute.vue'),
      'utf-8'
    )
    expect(comp).toContain('s.canonicalId === canonicalId.value && s.language === lang.value')

    await page.goto('/louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7')
    const leaf = page.locator('[data-source="pipeline-export"]')
    await expect(leaf).toHaveAttribute('data-segment', '00-01-002-008')
    await expect(leaf).toHaveAttribute('data-loaded', 'true') // in the vendored prose window
    await expect(
      page.getByText('na simples enunciação da palavra ser', { exact: false })
    ).toBeVisible()
    // the segment component renders no anchors (routePath is QA data, never an href)
    await expect(leaf.locator('a')).toHaveCount(0)
  })
})
