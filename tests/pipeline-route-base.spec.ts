import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { workHubHref } from '../.vitepress/theme/components/reader-shell'

// Architecture guard — the website-owned route projection (scripts/route_base.py). A projected route is
// ROUTE_BASE[workId] (the {locale}/{section}/{author}/{editionSlug} work prefix) + '/' + leaf(record, LEAF_POLICY).
// Slice A2 / IA-2 flipped BOTH knobs to the live values: ROUTE_BASE -> pt/filosofia/louis-lavelle/introducao-a-ontologia
// AND LEAF_POLICY -> prefix-only (leaf = the bare segmentPrefix). This guard pins that the live projection
// produces /pt/filosofia/louis-lavelle/introducao-a-ontologia/<segmentPrefix>, that the leaf policy is still a
// real knob, that identity (canonicalId/segmentPrefix) is route-neutral, and that no projection logic leaks
// into the reader components.

const ROUTE_BASE_PY = path.resolve('scripts/route_base.py')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const COMPONENTS = path.resolve('.vitepress/theme/components')

const WORK_ID = 'louis-lavelle/introduction-a-l-ontologie'
const LIVE_BASE = 'pt/filosofia/louis-lavelle/introducao-a-ontologia'
// The book-pipeline still mints a corpus-relative routePath with the publicSlug tail; the website projects it.
const VENDORED_RP = 'louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7'
const SEG_PREFIX = '00-01-002-008'

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

// Strip comments so the "no hard-coded prefix" check inspects CODE only (the reader components legitimately
// reference the live route in doc comments).
const stripComments = (s: string) =>
  s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')

// Project one segment through the real route_base.py (no base/policy overrides = the live ROUTE_BASE/LEAF_POLICY).
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

// This guard is about the Lavelle A2/IA-2 move specifically; scope to that work (the multi-work artifact
// also carries bras-cubas pt under a different ROUTE_BASE, covered in pipeline-export.spec).
function ptSegments(): any[] {
  return read(META)
    .segments.filter((s: any) => s.workId === WORK_ID && s.language === 'pt')
    .sort((a: any, b: any) => a.order - b.order)
}
const samplePt = () => ptSegments()[0]

test.describe('ROUTE_BASE projection (slice A2 / IA-2 live architecture guard)', () => {
  test('the live projection is locale-rooted + prefix-only (A2 both knobs active)', () => {
    const p = project(VENDORED_RP, SEG_PREFIX)

    expect(p.base).toBe(LIVE_BASE)
    expect(p.leafPolicy).toBe('prefix-only')
    expect(p.leaf).toBe(SEG_PREFIX) // bare segmentPrefix — the publicSlug tail is dropped
    expect(p.routePath).toBe(`${LIVE_BASE}/${SEG_PREFIX}`)
    expect(p.routePath.endsWith('-paragrafo-7')).toBe(false)
    expect(p.routePrefix).toBe(LIVE_BASE)
    expect(p.segmentDir).toBe('src/pt/filosofia/louis-lavelle/introducao-a-ontologia')
    expect(workHubHref(p.routePath)).toBe('/pt/filosofia/louis-lavelle/introducao-a-ontologia/')
  })

  test('the committed export reflects the live move: every pt route is locale-rooted + a bare segmentPrefix', () => {
    const data = read(META)
    const work = data.works.find((w: any) => w.workId === WORK_ID)
    const ptEdition = work.editions.find((e: any) => e.language === 'pt')
    const frEdition = work.editions.find((e: any) => e.language === 'fr')
    expect(ptEdition.routePrefix).toBe(LIVE_BASE)
    for (const s of data.segments.filter((x: any) => x.workId === WORK_ID && x.language === 'pt')) {
      expect(s.routePath).toBe(`${LIVE_BASE}/${s.segmentPrefix}`) // prefix + bare segmentPrefix, no slug tail
    }
    // the fr source edition is left at its old locale-less path and generates no page
    expect(frEdition.routePrefix).toBe('louis-lavelle/introduction-a-l-ontologie')
  })

  test('the leaf is still a live knob: vendored-slug carries the slug tail; base override relocates independently', () => {
    const v = project(VENDORED_RP, SEG_PREFIX, { leafPolicy: 'vendored-slug' })
    expect(v.leaf).toBe('00-01-002-008-paragrafo-7') // the vendored final segment, from the routePath
    expect(v.routePath).toBe(`${LIVE_BASE}/00-01-002-008-paragrafo-7`)

    const o = project(VENDORED_RP, SEG_PREFIX, { base: 'x/y/z' })
    expect(o.routePath).toBe('x/y/z/00-01-002-008') // base swaps, prefix-only leaf preserved
    expect(o.segmentDir).toBe('src/x/y/z')
  })

  test('prefix-only precondition holds: segmentPrefix is unique across the published edition (no leaf collisions)', () => {
    const prefixes = ptSegments().map((s) => s.segmentPrefix)
    expect(prefixes.length).toBe(99)
    expect(new Set(prefixes).size).toBe(prefixes.length)
  })

  test('identity is route-neutral: canonicalId/segmentPrefix are independent of the projected routePath', () => {
    const seg = samplePt()
    // canonicalId is built from the workId (source slug) + segmentPrefix — NOT the locale-rooted route — so
    // the A2 move can never change it. Identity != presentation.
    expect(seg.canonicalId).toBe(`${WORK_ID}/${seg.segmentPrefix}`)
    expect(seg.canonicalId.includes('pt/filosofia')).toBe(false)
    // the projection surface emits only the workId echo + route fields — no canonicalId/segmentPrefix output.
    const p = project(VENDORED_RP, SEG_PREFIX)
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

  test('both generators apply the website projection (wired, not bypassed; OUT_DIR derived, leaf policy used)', () => {
    const exp = fs.readFileSync(path.resolve('scripts/build-pipeline-export.py'), 'utf-8')
    expect(exp).toContain('from route_base import')
    expect(exp).toContain('project_route_path(')
    expect(exp).toContain('project_route_prefix(')
    expect(exp).toContain('segment_leaf(') // leaf is chosen by LEAF_POLICY, not hard-coded

    const seg = fs.readFileSync(path.resolve('scripts/build-pipeline-segment-routes.py'), 'utf-8')
    expect(seg).toContain('from route_base import')
    expect(seg).toContain('segment_dir_parts(')
    expect(/^OUT_DIR\s*=/m.test(seg)).toBe(false) // derived from the projected routePath, not hard-coded
  })

  test('no route projection logic leaks into the reader components or shell (comment-safe)', () => {
    // (1) NO component anywhere imports the Python projection helper or defines the ROUTE_BASE constant.
    const allComponents = fs
      .readdirSync(COMPONENTS)
      .filter((f) => f.endsWith('.vue') || f === 'reader-shell.ts')
    expect(allComponents.length).toBeGreaterThan(8) // all components covered, not a hand-picked subset
    for (const f of allComponents) {
      expect(
        /route_base|ROUTE_BASE/.test(stripComments(compSrc(f))),
        `${f} references ROUTE_BASE in code`
      ).toBe(false)
    }
    // (2) the pipeline components that render a routePath must not ASSEMBLE the locale-rooted prefix in
    // code — they derive every href from routePath; route prefixes live ONLY in scripts/route_base.py.
    // (Non-pipeline components such as the homepage may carry a static nav link to /pt/filosofia/, which
    // is not projection logic, so they are excluded from this check.)
    const readerComponents = [
      'PipelineReaderHeader.vue',
      'PipelineSegmentNav.vue',
      'PipelineWorkContents.vue',
      'PipelineWorkContentsMount.vue',
      'PipelineExportReview.vue',
      'PipelineReaderPreview.vue',
      'PipelineSegmentPreview.vue',
      'PipelineWindowPreview.vue',
      'reader-shell.ts'
    ]
    for (const f of readerComponents) {
      expect(
        stripComments(compSrc(f)).includes('pt/filosofia'),
        `${f} hard-codes the locale-rooted prefix in code`
      ).toBe(false)
    }
    expect(compSrc('reader-shell.ts')).toContain('export const workHubHref') // sanctioned href helper
  })
})
