import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Reading-app Slice b v1 — owned WorkContents book map (docs/work-contents-component-spec.md).
// Mounted on ONE mechanics target (/louis-lavelle/de-l-acte) via the content-top slot. The map is
// reusable (a future leaf overlay renders the same component with a currentId); these tests cover
// the hub mount: guarded presence, the authored book hierarchy, collapse a11y, SkLink leaves, and
// the printed-TOC (no docs-tree / no bullets / no slug-leakage) discipline.
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

const TARGET = 'louis-lavelle/de-l-acte.html'

test.describe('WorkContents — owned work-hub book map (Slice b v1)', () => {
  test('renders only on the de-l-acte work hub', () => {
    expect(block(html(TARGET)), 'present on de-l-acte hub').toBeTruthy()
  })

  test('is absent on leaves, other hubs, single-file works, podcast, and home', () => {
    const off = [
      'louis-lavelle/de-l-acte/01-00-001-l-experience-de-l-acte.html', // a leaf of the target work
      'louis-lavelle/index.html', // corpus hub
      'louis-lavelle/de-l-etre.html', // another (not-yet-adopted) work hub
      'louis-lavelle/a-consciencia-de-si.html', // another work hub
      'literatura/machado-de-assis/bras-cubas.html', // another work hub (flat, next slice)
      'literatura/machado-de-assis/a-cartomante.html', // single-file work
      'literatura/index.html',
      'podcast/francais/001-le-badge.html',
      'index.html'
    ]
    for (const rel of off) expect(html(rel), rel).not.toContain('work-contents')
  })

  test('renders the authored book hierarchy: 3 Livre groups, 27 chapter leaves', () => {
    const b = block(html(TARGET))!
    // localized group labels from works[].language (fr), never route family
    expect(b).toContain('Livre 1')
    expect(b).toContain('Livre 2')
    expect(b).toContain('Livre 3')
    // one disclosure button per book, each a real button with aria state
    expect(count(b, /<button\b/g)).toBe(3)
    expect(count(b, /aria-expanded="true"/g)).toBe(3) // small work -> default expanded
    expect(count(b, /aria-controls="wc-/g)).toBe(3)
    // 27 segment leaves, all real anchors (SkLink) into the target work
    const hrefs = [...b.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
    expect(hrefs.length).toBe(27)
    expect(hrefs.every((h) => h.startsWith('/louis-lavelle/de-l-acte/'))).toBe(true)
    expect(count(b, /<a\b/g)).toBe(27)
  })

  test('leaf text is the displayTitle, never the slug; no bullet-list markup', () => {
    const b = block(html(TARGET))!
    const text = visibleText(b)
    // displayTitle leads (authored "Chapitre …" carries its own quiet orientation). Use
    // apostrophe-free fragments so SSR entity-escaping of ' cannot make the assertion flaky.
    expect(text).toContain('Chapitre I. L') // first leaf, Livre 1
    expect(text).toMatch(/Chapitre XXVII\./) // last leaf, Livre 3
    // no slug leaks into the VISIBLE text (slugs live only in href attributes)
    expect(text).not.toMatch(/\d{2}-\d{2}-\d{3}/)
    expect(text).not.toContain('l-experience-de-l-acte')
    // printed TOC, not a docs file tree: no ul/ol/li bullet markup for segments
    expect(b).not.toMatch(/<ul\b/)
    expect(b).not.toMatch(/<ol\b/)
    expect(b).not.toMatch(/<li\b/)
  })

  test('collapse toggles via the group button (aria-expanded + controlled region)', async ({
    page
  }) => {
    await page.goto('/louis-lavelle/de-l-acte')
    const heading = page.locator('.work-contents__heading').first()
    await expect(heading).toHaveAttribute('aria-expanded', 'true')
    const regionId = await heading.getAttribute('aria-controls')
    const region = page.locator(`#${regionId}`)
    await expect(region).toBeVisible()

    await heading.click()
    await expect(heading).toHaveAttribute('aria-expanded', 'false')
    await expect(region).toBeHidden()

    await heading.click()
    await expect(heading).toHaveAttribute('aria-expanded', 'true')
    await expect(region).toBeVisible()
  })

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
})
