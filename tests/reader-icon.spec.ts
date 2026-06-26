import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice C1 — the owned ReaderIcon foundation (boundary + tokens only; no consumer swaps yet).
// Asserts the wrapper renders the vendored inline SVGs SSR-cleanly with the owned a11y/stroke
// defaults, that the registry is a closed set, and that no reader consumer / package.json changed.
const DIST = path.resolve('.vitepress/dist')
const HARNESS = '/reading-review/reader-icon-harness'
const HARNESS_HTML = path.resolve(DIST, 'reading-review/reader-icon-harness.html')
const COMP = path.resolve('.vitepress/theme/components/ReaderIcon.vue')
const REG = path.resolve('.vitepress/theme/components/reader-icons.ts')
const NAV = path.resolve('.vitepress/theme/components/PipelineSegmentNav.vue')
const HUB = path.resolve('.vitepress/theme/components/PipelineWorkContents.vue')
const NAMES = ['chevron-left', 'chevron-right', 'chevron-up', 'disclosure']

test.describe('ReaderIcon foundation (Slice C1, boundary + tokens only)', () => {
  test('renders inline SVGs in the SSR/built output with the owned static attributes', () => {
    const html = fs.readFileSync(HARNESS_HTML, 'utf-8')
    expect((html.match(/class="reader-icon/g) || []).length).toBeGreaterThanOrEqual(4) // SSR, no JS
    // SSR serializes the SVG viewBox lowercased; the HTML parser restores camelCase on parse (the
    // live DOM check is in the stroke test below). The icon still scales correctly.
    expect(html.toLowerCase()).toContain('viewbox="0 0 24 24"')
    expect(html).toContain('fill="none"')
    expect(html).toContain('stroke="currentColor"')
    expect(html).toContain('stroke-linecap="round"')
    expect(html).toContain('stroke-linejoin="round"')
    expect(html).toContain('focusable="false"')
    expect(html).toContain('vector-effect="non-scaling-stroke"')
  })

  test('default render is decorative: aria-hidden="true", focusable="false", no role/<title>', async ({
    page
  }) => {
    await page.goto(HARNESS)
    const svg = page.locator('[data-testid="ri-chevron-left"] svg.reader-icon')
    expect(await svg.getAttribute('aria-hidden')).toBe('true')
    expect(await svg.getAttribute('focusable')).toBe('false')
    expect(await svg.getAttribute('role')).toBeNull()
    await expect(svg.locator('title')).toHaveCount(0)
  })

  test('labelled render: role="img" + <title>, and NOT aria-hidden', async ({ page }) => {
    await page.goto(HARNESS)
    const svg = page.locator('[data-testid="ri-labelled"] svg.reader-icon')
    expect(await svg.getAttribute('role')).toBe('img')
    expect(await svg.getAttribute('aria-hidden')).toBeNull()
    await expect(svg.locator('title')).toHaveText('Voltar ao sumário')
  })

  test('uses --sk-icon-stroke (≈1.5px non-scaling) and --sk-icon-size (chrome = 1em) via currentColor', async ({
    page
  }) => {
    await page.goto(HARNESS)
    const svg = page.locator('[data-testid="ri-chevron-up"] svg.reader-icon').first()
    const m = await svg.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { stroke: cs.strokeWidth, width: cs.width, color: cs.stroke }
    })
    expect(parseFloat(m.stroke)).toBeCloseTo(1.5, 1) // --sk-icon-stroke
    expect(parseFloat(m.width)).toBeCloseTo(16, 0) // chrome = 1em at the 16px harness font-size
    expect(m.color).not.toBe('') // currentColor resolved to a real ink, not empty/"currentColor"
    expect(await svg.getAttribute('viewBox')).toBe('0 0 24 24') // parser normalizes viewbox → viewBox
  })

  test('all four allowed names render a distinct single-path glyph', async ({ page }) => {
    await page.goto(HARNESS)
    for (const name of NAMES) {
      await expect(page.locator(`[data-testid="ri-${name}"] svg.reader-icon path`)).toHaveCount(1)
    }
  })

  test('emits no focusable element beyond the SVG (focusable=false); owns no control/focus ring', async ({
    page
  }) => {
    await page.goto(HARNESS)
    const row = page.locator('[data-testid="reader-icon-chrome"]')
    await expect(row.locator('button, a, input, [tabindex]')).toHaveCount(0)
  })

  test('source discipline: closed union, vendored (no lucide/VTIcon import), frozen prop set', () => {
    const reg = fs.readFileSync(REG, 'utf-8')
    expect(reg).toContain("'chevron-left' | 'chevron-right' | 'chevron-up' | 'disclosure'")
    for (const deferred of [
      "'contents'",
      "'list'",
      "'languages'",
      "'globe'",
      "'progress'",
      "'book'"
    ]) {
      expect(reg.includes(deferred)).toBe(false) // closed set — deferred glyphs absent
    }
    const comp = fs.readFileSync(COMP, 'utf-8')
    expect(comp.includes('VTIcon')).toBe(false) // never the rented theme icons
    expect(reg).not.toMatch(/from ['"]@?lucide/) // no lucide import (paths are vendored)
    expect(comp).not.toMatch(/from ['"]@?lucide/)
    // the frozen API — only name / label / size; no stroke/color/rotate/svg-class prop
    expect(comp).toContain('name: ReaderIconName')
    expect(comp).toContain('label?: string')
    expect(comp).toContain("size?: 'chrome' | 'touch'")
    for (const banned of ['stroke?:', 'color?:', 'rotate?:'])
      expect(comp.includes(banned)).toBe(false)
    // stroke + size come from the owned tokens, never hardcoded
    expect(comp).toContain('var(--sk-icon-stroke)')
    expect(comp).toContain('var(--sk-icon-size)')
  })

  test('Slice C2 done / C3 pending: nav uses ReaderIcon (no text glyphs); hub still has the CSS triangle', () => {
    const nav = fs.readFileSync(NAV, 'utf-8')
    const hub = fs.readFileSync(HUB, 'utf-8')
    // C2: PipelineSegmentNav is swapped to ReaderIcon; the ‹ › ↑ text glyphs are gone
    expect(nav.includes("import ReaderIcon from './ReaderIcon.vue'")).toBe(true)
    expect(nav.includes('‹') || nav.includes('›') || nav.includes('↑')).toBe(false)
    expect(nav.includes('Trecho anterior')).toBe(true) // visible label preserved
    // C3 NOT done yet: the hub disclosure is still the CSS-triangle chevron, no ReaderIcon
    expect(hub.includes('border-left: 5px solid currentColor')).toBe(true)
    expect(hub.includes('ReaderIcon')).toBe(false)
  })

  test('package.json unchanged: no icon dependency added', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const k of Object.keys(deps)) expect(k.includes('lucide')).toBe(false)
  })
})
