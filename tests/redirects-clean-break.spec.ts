import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice A4 / IA-4 — clean-break / no-redirects policy. The obsolete Introdução fr->pt redirect map was
// removed: src/public/_redirects, the redirect-map JSON, the generator script, its build/package wiring,
// and the dedicated spec are all gone. Old /louis-lavelle/... URLs may 404 (accepted, explicit). No
// replacement redirects are created. File-based; runs after the full build, so it also proves the build
// does NOT regenerate any of these (determinism).
const DIST = path.resolve('.vitepress/dist')
const REDIRECTS = path.resolve('src/public/_redirects')
const REDIRECT_MAP = path.resolve(
  '.vitepress/theme/data/pipeline-redirect-map-introduction-a-l-ontologie.json'
)
const GEN = path.resolve('scripts/build-pipeline-redirect-map.py')

test.describe('redirects clean break (slice A4 / IA-4)', () => {
  test('the Cloudflare _redirects file is absent in src AND dist (no fr->pt redirects, clean break)', () => {
    expect(fs.existsSync(REDIRECTS)).toBe(false)
    expect(fs.existsSync(path.join(DIST, '_redirects'))).toBe(false) // the build did not emit one
  })

  test('the obsolete redirect-map artifact + generator are gone (removed, not just disabled)', () => {
    expect(fs.existsSync(REDIRECT_MAP)).toBe(false)
    expect(fs.existsSync(GEN)).toBe(false)
    expect(fs.existsSync(path.resolve('tests/pipeline-redirect-map.spec.ts'))).toBe(false) // dedicated spec deleted
    // no build/package wiring can regenerate it (build determinism)
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'))
    expect(pkg.scripts.build.includes('build-pipeline-redirect-map')).toBe(false)
    expect('pipeline:redirect-map' in pkg.scripts).toBe(false)
  })

  test('the moved book stays live without a redirect: hub + a prefix-only leaf build and are indexable', () => {
    const hub = path.join(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/index.html')
    const leaf = path.join(
      DIST,
      'pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.html'
    )
    expect(fs.existsSync(hub)).toBe(true)
    expect(fs.existsSync(leaf)).toBe(true)
    // indexable: no robots-noindex on the hub or the leaf (VitePress emits content="noindex")
    expect(fs.readFileSync(hub, 'utf-8')).not.toMatch(/name="robots"[^>]*content="noindex"/)
    expect(fs.readFileSync(leaf, 'utf-8')).not.toMatch(/name="robots"[^>]*content="noindex"/)
  })

  test('the legacy fr chapter pages are gone (removed in A5) and were never replaced by a redirect (404 debt accepted)', () => {
    // A5 removed the whole legacy /louis-lavelle/ corpus, including the fr edition; A4 already removed
    // any redirect, so the old fr chapter URLs simply 404.
    expect(fs.existsSync(path.resolve('src/louis-lavelle/introduction-a-l-ontologie'))).toBe(false)
    expect(fs.existsSync(path.join(DIST, 'louis-lavelle'))).toBe(false)
    expect(fs.existsSync(REDIRECTS)).toBe(false)
  })
})
