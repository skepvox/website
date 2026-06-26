import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Reading-app Slice b v1 — owned WorkContents book map (docs/work-contents-component-spec.md).
// Mounted on the flat-mode stress target (literatura/machado-de-assis/bras-cubas) via the content-top
// slot. The grouped-mode mechanics target was louis-lavelle/de-l-acte, removed with the legacy corpus
// in A5; no current literatura work is authored-grouped, so the grouped-mode tests (3 Livre groups,
// collapse a11y, displayTitle leaves) were retired with it and return with a future grouped book. These
// tests cover the flat-mode hub mount + the printed-TOC (no docs-tree / no bullets / no slug-leakage) discipline.
const DIST = path.resolve('.vitepress/dist')
const html = (rel: string) => fs.readFileSync(path.join(DIST, rel), 'utf-8')

const NAV_RE = /<nav class="work-contents[\s\S]*?<\/nav>/
const block = (page: string) => (page.match(NAV_RE) || [null])[0]
const visibleText = (b: string) =>
  b
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const count = (b: string, re: RegExp) => (b.match(re) || []).length

const FLAT = 'literatura/machado-de-assis/bras-cubas.html' // flat-mode stress target (the sole allowlisted hub)

test.describe('WorkContents — owned work-hub book map (Slice b)', () => {
  test('renders on the allowlisted work hub (bras-cubas, flat mode)', () => {
    expect(block(html(FLAT)), 'present on bras-cubas hub').toBeTruthy()
  })

  test('is absent on leaves, non-adopted hubs, single-file works, podcast, and home', () => {
    const off = [
      'literatura/machado-de-assis/dom-casmurro/00-01-001-do-titulo.html', // a reading leaf
      'literatura/machado-de-assis/dom-casmurro.html', // another (not-allowlisted) work hub
      'literatura/machado-de-assis/a-cartomante.html', // single-file work
      'literatura/index.html', // section hub
      'literatura/machado-de-assis/index.html', // author hub
      'podcast/francais/001-le-badge.html',
      'index.html'
    ]
    for (const rel of off) expect(html(rel), rel).not.toContain('work-contents')
  })

  // (The grouped-mode tests — 3 Livre groups + 27 chapter leaves, displayTitle leaf labels, and the
  // collapse-disclosure a11y — were exercised only by louis-lavelle/de-l-acte, the sole authored-grouped
  // work, removed in A5. No current literatura work is grouped, so grouped-mode coverage returns with a
  // future grouped book; the flat-mode tests (Brás Cubas) below remain.)

  test('leaves use SkLink; hover is pointer-gated; button owns the shared focus ring', () => {
    const src = fs.readFileSync(
      path.resolve('.vitepress/theme/components/WorkContents.vue'),
      'utf-8'
    )
    expect(src).toContain("import SkLink from './SkLink.vue'")
    expect(src).toContain('<SkLink')
    // visible hover lift sits inside the pointer media query (no touch hover leakage)
    const media = src.indexOf('@media (hover: hover) and (pointer: fine)')
    expect(media).toBeGreaterThan(-1)
    expect(src.indexOf('.work-contents__link:hover')).toBeGreaterThan(media)
    // the disclosure button (a real <button>, not a SkLink) uses the shared focus language
    expect(src).toMatch(/\.work-contents__heading:focus-visible\s*\{[^}]*var\(--sk-focus-ring\)/)
    // links delegate their focus ring to SkLink — no per-link :focus-visible rule here
    expect(src).not.toMatch(/\.work-contents__link:focus-visible/)
  })

  // ---- Flat mode: Brás Cubas (163 leaves, empty groupPath) ----

  test('bras-cubas uses flat mode: presentation range dividers, no collapsible authored groups', () => {
    const b = block(html(FLAT))!
    // quiet presentation dividers (scan aids), pt-BR labels
    expect(b).toContain('Matéria inicial')
    expect(b).toContain('Capítulos 001–010')
    expect(b).toContain('Capítulos 051–060') // the range holding ch 053
    expect(b).toContain('Capítulos 151–160')
    // flat mode invents NO authored hierarchy and is NOT collapsible
    expect(b).not.toContain('aria-expanded')
    expect(count(b, /<button\b/g)).toBe(0)
    // dividers are not Livre/Partie/Capítulo authored headers
    expect(b).not.toContain('Livre ')
  })

  test('bras-cubas renders all 163 leaves as SkLink anchors in reading-nav order', () => {
    const b = block(html(FLAT))!
    const rn = JSON.parse(
      fs.readFileSync(path.resolve('.vitepress/theme/data/reading-nav.json'), 'utf-8')
    )
    const route = '/literatura/machado-de-assis/bras-cubas'
    const expected = rn[route].map(([slug]: [string]) => `${route}/${slug}`)
    expect(expected.length).toBe(163)
    const hrefs = [...b.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
    expect(hrefs).toEqual(expected) // exact reading order, front matter first
    expect(count(b, /<a\b/g)).toBe(163)
  })

  test('chapter 053 shows a compact label, never the opening sentence, route preserved', () => {
    const b = block(html(FLAT))!
    // the long opening sentence must NOT appear as visible text (distinctive word "Lembrava")
    expect(visibleText(b)).not.toContain('Lembrava')
    // …but the public route is untouched (slug lives only in the href attribute)
    expect(b).toContain(
      'href="/literatura/machado-de-assis/bras-cubas/00-09-053-virgilia-e-que-ja-se-nao-lembrava'
    )
    // the compact ordinal label is shown for that chapter (only ch.053 collapses to a bare number)
    expect(visibleText(b)).toContain('053')
  })

  test('bras-cubas: no slug leakage as visible text, no bullet-list markup', () => {
    const b = block(html(FLAT))!
    expect(visibleText(b)).not.toMatch(/\d{2}-\d{2}-\d{3}/) // no BB-PP-CCC slug in visible text
    expect(b).not.toMatch(/<ul\b/)
    expect(b).not.toMatch(/<ol\b/)
    expect(b).not.toMatch(/<li\b/)
  })
})
