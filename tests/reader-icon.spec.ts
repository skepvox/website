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

  test('Slice C2 + C3 done: both reader consumers use ReaderIcon; the hand-rolled glyphs are gone', () => {
    const nav = fs.readFileSync(NAV, 'utf-8')
    const hub = fs.readFileSync(HUB, 'utf-8')
    // C2: PipelineSegmentNav on ReaderIcon; the ‹ › ↑ text glyphs are gone
    expect(nav.includes("import ReaderIcon from './ReaderIcon.vue'")).toBe(true)
    expect(nav.includes('‹') || nav.includes('›') || nav.includes('↑')).toBe(false)
    expect(nav.includes('Trecho anterior')).toBe(true) // visible label preserved
    // C3: PipelineWorkContents on ReaderIcon; the .pwc__chevron CSS triangle is gone
    expect(hub.includes("import ReaderIcon from './ReaderIcon.vue'")).toBe(true)
    expect(hub.includes('name="disclosure"')).toBe(true) // the owned disclosure glyph
    expect(hub.includes('border-left: 5px solid currentColor')).toBe(false)
    // neither consumer ships an ad hoc inline <svg> — the owned wrapper is the only glyph source
    expect(/<svg[\s>]/.test(nav)).toBe(false)
    expect(/<svg[\s>]/.test(hub)).toBe(false)
  })

  test('package.json unchanged: no icon dependency added', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const k of Object.keys(deps)) expect(k.includes('lucide')).toBe(false)
  })
})

// ---- Slice C4: icon-system hardening + governance lock ----
// The dark-mode decision is MEASURED, not guessed: the owned chevrons stroke at the meaning-bearing
// muted ink (currentColor), giving ~6.3:1 contrast on warm-dark and ~4.6:1 in light — both well above
// the 3:1 WCAG non-text / UI-component bar. So --sk-icon-stroke-dark STAYS DORMANT (colour-first
// sufficed; a heavier dark stroke would solve a problem that does not exist). These tests lock that in,
// plus the a11y / motion / closed-API guarantees, so the reader shell cannot drift the icon language.
const LEAF = '/louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7'
const PT_HUB = '/louis-lavelle/introducao-a-ontologia/'
const NAV_ICON = '[data-testid="pseg-nav"] svg.reader-icon'
const DISC_ICON = 'nav.pwc .pwc__chapter-heading svg.reader-icon'

// Effective stroke contrast: resolve currentColor, composite its alpha over the nearest painted
// background, and compute the WCAG ratio — i.e. what the eye actually sees, not the nominal token.
async function iconMetrics(page: import('@playwright/test').Page, sel: string) {
  return page
    .locator(sel)
    .first()
    .evaluate((el) => {
      const parse = (c: string) => {
        const m = (c.match(/[\d.]+/g) || []).map(Number)
        return { r: m[0] || 0, g: m[1] || 0, b: m[2] || 0, a: m[3] ?? 1 }
      }
      const lin = (v: number) => {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      const lum = (c: { r: number; g: number; b: number }) =>
        0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
      const bgOf = (n: Element | null) => {
        while (n) {
          const c = getComputedStyle(n).backgroundColor
          if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return parse(c)
          n = n.parentElement
        }
        return { r: 255, g: 255, b: 255, a: 1 }
      }
      const cs = getComputedStyle(el)
      const s = parse(cs.stroke)
      const bg = bgOf(el)
      // Fold the element's effective opacity (its own × every ancestor's) into the stroke alpha, so a
      // CSS `opacity` dim — the exact old vanish-bug mechanism, which never shows up in cs.stroke —
      // actually lowers the measured contrast. Without this the ratio would be computed as if opaque.
      let op = 1
      for (let n: Element | null = el; n; n = n.parentElement)
        op *= parseFloat(getComputedStyle(n).opacity || '1')
      const a = s.a * op
      const eff = {
        r: a * s.r + (1 - a) * bg.r,
        g: a * s.g + (1 - a) * bg.g,
        b: a * s.b + (1 - a) * bg.b
      }
      const L1 = lum(eff)
      const L2 = lum(bg)
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
      return { strokeWidth: cs.strokeWidth, stroke: cs.stroke, opacity: op, ratio }
    })
}

test.describe('ReaderIcon — Slice C4 hardening + governance lock', () => {
  // governance: the wrapper is inert (it animates nothing; the only motion is consumer-owned rotation).
  // Scoped to the <style> block (no comment false-positives) and matches LONGHANDS too, so a
  // transition-property:/animation-name: drift cannot slip past a shorthand-only regex.
  test('ReaderIcon owns no animation (no transition/animation property — shorthand or longhand)', () => {
    const comp = fs.readFileSync(COMP, 'utf-8')
    const style = comp.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''
    expect(style.length).toBeGreaterThan(0)
    expect(/\btransition[a-z-]*\s*:/i.test(style)).toBe(false) // transition / transition-property / ...
    expect(/\banimation[a-z-]*\s*:/i.test(style)).toBe(false) // animation / animation-name / ...
    expect(style.includes('@keyframes')).toBe(false)
  })

  // governance: the API is FROZEN — exactly name/label/size, no escape hatches that would fork the
  // language glyph-by-glyph (no stroke/color/rotate/class/path/raw-svg props).
  test('frozen prop set: ReaderIcon declares only name / label / size', () => {
    const comp = fs.readFileSync(COMP, 'utf-8')
    const block = comp.match(/defineProps<\{[\s\S]*?\}>/)?.[0] ?? ''
    expect(block).toContain('name: ReaderIconName')
    expect(block).toContain('label?: string')
    expect(block).toContain("size?: 'chrome' | 'touch'")
    for (const banned of ['stroke', 'color', 'rotate', 'class', 'path', 'viewbox', 'fill'])
      expect(block.toLowerCase()).not.toContain(banned)
    expect((block.match(/:/g) || []).length).toBe(3) // exactly three declared props
  })

  // governance: the closed union is unchanged — no fifth glyph crept in.
  test('closed union unchanged: exactly the four v1 names', () => {
    const reg = fs.readFileSync(REG, 'utf-8')
    const union = (reg.match(/ReaderIconName\s*=\s*([^\n]+)/)?.[1] ?? '').replace(/\s/g, '')
    expect(union).toBe("'chevron-left'|'chevron-right'|'chevron-up'|'disclosure'")
  })

  // governance: neither consumer reaches around the wrapper (no rented theme icons, no lucide, no
  // ad hoc <svg> — the owned ReaderIcon is the only glyph source).
  test('no @vue/theme, no lucide, no ad hoc <svg> in either reader consumer', () => {
    for (const f of [NAV, HUB]) {
      const src = fs.readFileSync(f, 'utf-8')
      expect(/from ['"]@vue\/theme/.test(src)).toBe(false)
      expect(src.includes('VTIcon')).toBe(false)
      expect(/from ['"]@?lucide/.test(src)).toBe(false) // no direct lucide import in a consumer
      expect(/<svg[\s>]/.test(src)).toBe(false)
    }
  })

  // The dark-mode decision, locked MECHANISM-INDEPENDENTLY: the hatch is DEFINED, but the RENDERED dark
  // stroke is the owned 1.5 hairline — activating a heavier dark stroke by ANY means (class, alias,
  // calc, media query, consumer override) would make this 1.75 and fail. (The dormant call rests on
  // computed contrast + visual inspection; a real-panel OLED check remains the documented trigger to
  // flip the hatch if the 1.5px hairline ever reads fragile at the smallest shipped size.)
  test('--sk-icon-stroke-dark stays DORMANT: defined, but the live dark stroke is the 1.5 hairline', async ({
    page
  }) => {
    const vars = fs.readFileSync(path.resolve('.vitepress/theme/styles/vars.css'), 'utf-8')
    expect(/--sk-icon-stroke-dark\s*:\s*1\.75/.test(vars)).toBe(true) // the hatch is wired + available
    await page.addInitScript(() => {
      try {
        localStorage.setItem('vitepress-theme-appearance', 'dark')
        localStorage.setItem('skepvox-consent', 'denied')
      } catch {
        /* storage unavailable */
      }
    })
    await page.goto(LEAF)
    const navSW = await page
      .locator(NAV_ICON)
      .first()
      .evaluate((el) => getComputedStyle(el).strokeWidth)
    await page.goto(PT_HUB)
    const discSW = await page
      .locator(DISC_ICON)
      .first()
      .evaluate((el) => getComputedStyle(el).strokeWidth)
    expect(parseFloat(navSW)).toBeCloseTo(1.5, 1) // not 1.75 — the hatch is not applied in dark
    expect(parseFloat(discSW)).toBeCloseTo(1.5, 1)
  })

  // visual/contrast: the owned hairline is dark-safe AND light-safe (measured ≥ 3:1) for BOTH surfaces.
  for (const dark of [false, true]) {
    test(`icon stroke + contrast hold in ${dark ? 'dark' : 'light'} mode (nav + disclosure ≥ 3:1)`, async ({
      page
    }) => {
      await page.addInitScript((d) => {
        try {
          localStorage.setItem('vitepress-theme-appearance', d ? 'dark' : 'light')
          localStorage.setItem('skepvox-consent', 'denied')
        } catch {
          /* storage unavailable */
        }
      }, dark)
      await page.goto(LEAF)
      const nav = await iconMetrics(page, NAV_ICON)
      expect(parseFloat(nav.strokeWidth)).toBeCloseTo(1.5, 1) // the owned 1.5px hairline, both modes
      expect(nav.stroke).toMatch(/rgb/) // currentColor resolved to a real ink (not "currentColor")
      expect(nav.ratio).toBeGreaterThanOrEqual(3) // visible — never the opacity-dim vanish bug
      expect(nav.opacity).toBe(1) // no CSS opacity dim on the glyph (the old vanish-bug mechanism)

      await page.goto(PT_HUB)
      const disc = await iconMetrics(page, DISC_ICON)
      expect(parseFloat(disc.strokeWidth)).toBeCloseTo(1.5, 1)
      expect(disc.stroke).toMatch(/rgb/)
      expect(disc.ratio).toBeGreaterThanOrEqual(3)
      expect(disc.opacity).toBe(1)
    })
  }
})
