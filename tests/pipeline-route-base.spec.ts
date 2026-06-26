import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { workHubHref } from '../.vitepress/theme/components/reader-shell'

// Architecture guard — slice A1 / IA-1, the website-owned route projection (scripts/route_base.py).
// docs/locale-rooted-website-ia-assessment.md §6.6 + §10 (A1); docs/filosofia-ia-pilot-migration-assessment.md
// §6.3 + §10.10. A projected route is ROUTE_BASE[workId] (the {locale}/{section}/{author}/{editionSlug}
// work prefix) + '/' + leaf(record, LEAF_POLICY). TODAY both knobs reproduce the current paths exactly
// (zero route move). A2 / IA-2 flips BOTH: ROUTE_BASE -> pt/filosofia/... AND LEAF_POLICY -> prefix-only,
// relocating routePath / routePrefix / OUT_DIR / workHubHref together. routePath is presentation only —
// identity (canonicalId/segmentPrefix) is route-neutral, and no projection logic leaks into the components.

const ROUTE_BASE_PY = path.resolve('scripts/route_base.py')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const COMPONENTS = path.resolve('.vitepress/theme/components')

const WORK_ID = 'louis-lavelle/introduction-a-l-ontologie'
const CURRENT_BASE = 'louis-lavelle/introducao-a-ontologia'
const FUTURE_BASE = 'pt/filosofia/louis-lavelle/introducao-a-ontologia'

type Projection = {
  workId: string
  base: string
  leafPolicy: string
  leaf: string
  routePath: string
  routePrefix: string
  segmentDir: string
}

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const compSrc = (f: string) => fs.readFileSync(path.join(COMPONENTS, f), 'utf-8')

// Project one segment through the real route_base.py (no base = current ROUTE_BASE; no policy = default).
function project(
  routePath: string,
  segmentPrefix: string,
  opts: { base?: string; leafPolicy?: string } = {}
): Projection {
  const args = [
    ROUTE_BASE_PY,
    '--work-id',
    WORK_ID,
    '--route-path',
    routePath,
    '--segment-prefix',
    segmentPrefix
  ]
  if (opts.base) args.push('--base', opts.base)
  if (opts.leafPolicy) args.push('--leaf-policy', opts.leafPolicy)
  return JSON.parse(execFileSync('python3', args, { encoding: 'utf-8' }))
}

function ptSegments(): any[] {
  return read(META)
    .segments.filter((s: any) => s.language === 'pt')
    .sort((a: any, b: any) => a.order - b.order)
}
const samplePt = () => ptSegments()[0]

test.describe('ROUTE_BASE projection (slice A1 / IA-1 architecture guard)', () => {
  test('current base + default leaf policy reproduce today’s paths exactly (zero user-visible route move)', () => {
    const seg = samplePt()
    const leaf = seg.routePath.split('/').pop()
    const p = project(seg.routePath, seg.segmentPrefix)

    expect(p.base).toBe(CURRENT_BASE)
    expect(p.leafPolicy).toBe('vendored-slug')
    expect(p.leaf).toBe(leaf) // <segmentPrefix>-<publicSlug>, preserved exactly
    expect(p.routePath).toBe(`${CURRENT_BASE}/${leaf}`)
    expect(p.routePath).toBe(seg.routePath) // byte-identical to the committed export
    expect(p.routePrefix).toBe(CURRENT_BASE)
    expect(p.segmentDir).toBe('src/louis-lavelle/introducao-a-ontologia')
    expect(workHubHref(p.routePath)).toBe('/louis-lavelle/introducao-a-ontologia/')
  })

  test('A2 two-knob flip (base -> pt/filosofia AND leaf policy -> prefix-only) relocates the whole route', () => {
    const seg = samplePt()
    const p = project(seg.routePath, seg.segmentPrefix, {
      base: FUTURE_BASE,
      leafPolicy: 'prefix-only'
    })

    // leaf is the BARE segmentPrefix — the descriptive publicSlug tail is gone (no URL churn on re-slug).
    expect(p.leaf).toBe(seg.segmentPrefix)
    expect(p.routePath).toBe(`${FUTURE_BASE}/${seg.segmentPrefix}`)
    expect(p.routePath.endsWith(`-${seg.publicSlug}`)).toBe(false)
    expect(p.routePrefix).toBe(FUTURE_BASE)
    expect(p.segmentDir).toBe('src/pt/filosofia/louis-lavelle/introducao-a-ontologia')
    expect(workHubHref(p.routePath)).toBe('/pt/filosofia/louis-lavelle/introducao-a-ontologia/')
  })

  test('the two knobs are independent: base flip alone keeps the vendored leaf; leaf flip alone keeps the base', () => {
    const seg = samplePt()
    const leaf = seg.routePath.split('/').pop()

    // base knob only (still vendored-slug leaf)
    const baseOnly = project(seg.routePath, seg.segmentPrefix, { base: FUTURE_BASE })
    expect(baseOnly.routePath).toBe(`${FUTURE_BASE}/${leaf}`)
    expect(baseOnly.segmentDir).toBe('src/pt/filosofia/louis-lavelle/introducao-a-ontologia')

    // leaf knob only (still current base)
    const leafOnly = project(seg.routePath, seg.segmentPrefix, { leafPolicy: 'prefix-only' })
    expect(leafOnly.routePath).toBe(`${CURRENT_BASE}/${seg.segmentPrefix}`)
    expect(leafOnly.segmentDir).toBe('src/louis-lavelle/introducao-a-ontologia')
  })

  test('prefix-only precondition: segmentPrefix is unique across the published edition (no leaf collisions)', () => {
    const prefixes = ptSegments().map((s) => s.segmentPrefix)
    expect(prefixes.length).toBe(99)
    expect(new Set(prefixes).size).toBe(prefixes.length)
  })

  test('identity is route-neutral: canonicalId/segmentPrefix are independent of the projected routePath', () => {
    const seg = samplePt()
    // canonicalId is built from the workId (source slug) + segmentPrefix — NOT the pt route slug — so
    // re-projecting routePath can never change it. Identity != presentation.
    expect(seg.canonicalId).toBe(`${WORK_ID}/${seg.segmentPrefix}`)
    expect(seg.canonicalId.includes('introducao-a-ontologia')).toBe(false)
    // the projection surface emits only the workId echo + route fields — no canonicalId/segmentPrefix
    // in the output, so identity can never be re-derived or mutated by a route projection.
    const p = project(seg.routePath, seg.segmentPrefix, {
      base: FUTURE_BASE,
      leafPolicy: 'prefix-only'
    })
    expect(Object.keys(p).sort()).toEqual([
      'base',
      'leaf',
      'leafPolicy',
      'routePath',
      'routePrefix',
      'segmentDir',
      'workId'
    ])
    expect('canonicalId' in p).toBe(false)
    expect('segmentPrefix' in p).toBe(false)
  })

  test('the committed export already reflects the current projection (pt projected, fr source untouched)', () => {
    const data = read(META)
    const ptEdition = data.work.editions.find((e: any) => e.language === 'pt')
    const frEdition = data.work.editions.find((e: any) => e.language === 'fr')
    expect(ptEdition.routePrefix).toBe(CURRENT_BASE)
    // every pt segment hangs under the current base; the fr source edition is left as-is (no page).
    for (const s of data.segments.filter((x: any) => x.language === 'pt')) {
      expect(s.routePath.split('/').slice(0, -1).join('/')).toBe(CURRENT_BASE)
    }
    expect(frEdition.routePrefix).toBe('louis-lavelle/introduction-a-l-ontologie')
  })

  test('both generators apply the website projection (wired, not bypassed; OUT_DIR derived, leaf policy used)', () => {
    const exp = fs.readFileSync(path.resolve('scripts/build-pipeline-export.py'), 'utf-8')
    expect(exp).toContain('from route_base import')
    expect(exp).toContain('project_route_path(')
    expect(exp).toContain('project_route_prefix(')
    expect(exp).toContain('segment_leaf(') // leaf is chosen by LEAF_POLICY, not hard-coded

    const seg = fs.readFileSync(path.resolve('scripts/build-pipeline-segment-routes.py'), 'utf-8')
    expect(seg).toContain('from route_base import')
    expect(seg).toContain('segment_dir_parts(')
    // the output directory is derived from the projected routePath, no longer a hard-coded constant.
    expect(/^OUT_DIR\s*=/m.test(seg)).toBe(false)
  })

  test('no route projection logic leaks into the reader components or shell (globbed, not a fixed list)', () => {
    const files = fs
      .readdirSync(COMPONENTS)
      .filter((f) => f.endsWith('.vue') || f === 'reader-shell.ts')
    expect(files.length).toBeGreaterThan(8) // all components are covered, not a hand-picked subset
    for (const f of files) {
      const src = compSrc(f)
      // no Python projection import / ROUTE_BASE constant, and — the real regression — no hard-coded
      // locale-rooted prefix assembled in a component. Route prefixes live ONLY in scripts/route_base.py.
      expect(/route_base|ROUTE_BASE/.test(src), `${f} references ROUTE_BASE`).toBe(false)
      expect(src.includes('pt/filosofia'), `${f} hard-codes the locale-rooted prefix`).toBe(false)
    }
    // the sanctioned hub-href helper stays the single source of href construction from routePath.
    expect(compSrc('reader-shell.ts')).toContain('export const workHubHref')
  })
})
