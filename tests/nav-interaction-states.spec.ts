import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice 1 — the navigation interaction-state standard, locked.
// Every navigation / card / list affordance must keep FOUR states distinct and
// non-conflicting:
//   HOVER    only under @media (hover: hover) and (pointer: fine)  (never on touch)
//   PRESSED  via :active, never inheriting hover (touch stays stable until navigation)
//   FOCUS    via --sk-focus-ring / :focus-visible
//   CURRENT  route via an explicit active class / aria-current, distinct from the above
// Standard: docs/navigation-owned-shell-assessment.md.

const THEME = path.resolve('.vitepress/theme')
const read = (rel: string) => fs.readFileSync(path.join(THEME, rel), 'utf-8')

// The visible hover declaration must sit AFTER the pointer media-query opener (i.e.
// inside it), so it cannot apply on touch — mirroring CardGrid.vue.
function hoverIsPointerGated(source: string, signatureHoverDecl: string): boolean {
  const media = source.indexOf('@media (hover: hover) and (pointer: fine)')
  const decl = source.indexOf(signatureHoverDecl)
  return media > -1 && decl > -1 && media < decl
}

// Owned affordances and the single declaration that proves their visible hover styling.
// All four keep their VISIBLE hover local + pointer-gated. The focus ring is owned either
// per-component (CardGrid, Home) or — after the SkLink slice — by the SkLink primitive the
// consumer wraps its anchor in (PodcastShowHeader, ReadingNav).
const OWNED = [
  { file: 'components/CardGrid.vue', hover: 'border-color: var(--sk-accent)' },
  { file: 'components/Home.vue', hover: 'border-color: var(--sk-accent)' },
  { file: 'components/PodcastShowHeader.vue', hover: 'border-bottom-color: var(--sk-accent)' },
  { file: 'components/ReadingNav.vue', hover: 'color: var(--sk-reading-heading)' }
]

// Surfaces that own their focus ring directly vs. surfaces that delegate it to SkLink.
// (CardGrid + Home are the documented fast-follow migration candidates.)
const OWNS_FOCUS = ['components/CardGrid.vue', 'components/Home.vue']
const DELEGATES_TO_SKLINK = ['components/PodcastShowHeader.vue', 'components/ReadingNav.vue']

test.describe('nav interaction-state standard — owned affordances', () => {
  for (const c of OWNED) {
    test(`${c.file}: visible hover is gated behind the pointer media query`, () => {
      expect(hoverIsPointerGated(read(c.file), c.hover), c.file).toBe(true)
    })
  }

  for (const file of OWNS_FOCUS) {
    test(`${file}: owns its keyboard focus ring (--sk-focus-ring)`, () => {
      expect(read(file), file).toMatch(/:focus-visible\s*\{[^}]*var\(--sk-focus-ring\)/)
    })
  }

  for (const file of DELEGATES_TO_SKLINK) {
    test(`${file}: wraps its anchor in SkLink and declares no own :focus-visible rule`, () => {
      const src = read(file)
      expect(src, file).toContain("import SkLink from './SkLink.vue'")
      expect(src, file).toContain('<SkLink')
      // the per-component focus rule is removed; SkLink owns it now (the explanatory
      // comment may mention :focus-visible, so match the RULE form `:focus-visible {`).
      expect(src, file).not.toMatch(/:focus-visible\s*\{/)
    })
  }
})

test.describe('nav interaction-state standard — SkLink primitive', () => {
  const sk = read('components/SkLink.vue')

  test('is a transparent single <a> root with href + slot (no wrapper element)', () => {
    expect(sk).toMatch(/<a\b[^>]*:href="href"/)
    expect(sk).toContain('<slot')
    const template = sk.slice(sk.indexOf('<template>'), sk.indexOf('</template>'))
    expect(template.match(/<a\b/g)?.length, 'exactly one anchor, no wrapper').toBe(1)
  })

  test('passes attrs through transparently (inheritAttrs:false + v-bind="$attrs")', () => {
    expect(sk).toContain('inheritAttrs: false')
    expect(sk).toContain('v-bind="$attrs"')
  })

  test('emits aria-current="page" only when current', () => {
    expect(sk).toMatch(/:aria-current="current \? 'page' : undefined"/)
  })

  test('owns the shared keyboard focus ring', () => {
    expect(sk).toMatch(/a:focus-visible\s*\{[^}]*var\(--sk-focus-ring\)/)
  })

  test('does NOT define a visible hover colour itself (consumer-owned, pointer-gated)', () => {
    expect(sk).not.toContain(':hover')
  })
})

test.describe('nav interaction-state standard — rented chrome floor (pages.css)', () => {
  const pagesCss = fs.readFileSync(path.join(THEME, 'styles/pages.css'), 'utf-8')

  test('chrome :focus-visible routes onto the owned --sk-focus-ring (one focus language)', () => {
    expect(pagesCss).toContain('.VPSkipLink:focus-visible')
    expect(pagesCss).toContain('.VPContentDocOutline a:focus-visible')
    expect(pagesCss).toMatch(/:focus-visible[\s\S]*?\{[^}]*var\(--sk-focus-ring\)/)
  })

  test('the appearance toggle has a >=44px hit area within its own box', () => {
    expect(pagesCss).toMatch(/\.vt-switch::after\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px/)
  })

  test('the 768-1279px toggle dead-band is bridged (force-show to 1279.98px)', () => {
    expect(pagesCss).toMatch(
      /@media \(max-width: 1279\.98px\)\s*\{[\s\S]*?\.VPNavBar \.VPNavBarAppearance/
    )
  })

  test('sidebar hover is repaired, pointer-gated, and distinct from the active route', () => {
    // Documented shell standard: #VPSidebarNav (the id @vue/theme assigns to the sidebar
    // <nav>, VPSidebar.vue) is an ID selector that strictly out-specifies the scoped,
    // invalid `.link:hover .link-text { color: var(--vt-c-brand-text-1) }` theme rule —
    // a stable win, not a source-order tie-break. If the id is ever renamed, this fails.
    expect(pagesCss).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)\s*\{\s*#VPSidebarNav \.link:hover \.link-text\s*\{\s*color:\s*var\(--sk-text\)/
    )
    // hover (full ink) must NOT be the accent the current route (.link.active) uses.
    expect(pagesCss).not.toMatch(
      /#VPSidebarNav \.link:hover \.link-text\s*\{\s*color:\s*var\(--sk-accent\)/
    )
  })
})

test.describe('nav interaction-state standard — green family routed (dist CSS)', () => {
  const DIST = path.resolve('.vitepress/dist')

  function allCss(): string {
    const out: string[] = []
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(p)
        else if (entry.name.endsWith('.css')) out.push(fs.readFileSync(p, 'utf-8'))
      }
    }
    walk(DIST)
    return out.join('\n')
  }

  const css = allCss()

  test('the legacy green / brand-shade family is routed to the owned accent', () => {
    expect(css).toMatch(/--vt-c-green:\s*var\(--sk-accent\)/)
    expect(css).toMatch(/--vt-c-green-light:\s*var\(--sk-accent-hover\)/)
    expect(css).toMatch(/--vt-c-brand-light:\s*var\(--sk-accent-hover\)/)
    expect(css).toMatch(/--vt-c-brand-dark:\s*var\(--sk-accent-hover\)/)
    expect(css).toMatch(/--vt-c-brand-highlight:\s*var\(--sk-accent-hover\)/)
  })
})

test.describe('nav interaction-state standard — rendered behaviour', () => {
  test('the skip link renders the owned accent, not legacy Vue green', async ({ page }) => {
    await page.goto('/')
    const color = await page.evaluate(() => {
      const el = document.querySelector('.VPSkipLink')
      return el ? getComputedStyle(el).color : null
    })
    expect(color).not.toBe('rgb(66, 184, 131)') // legacy #42b883
    expect(color).toBe('rgb(47, 74, 107)') // --sk-accent #2f4a6b (light)
  })

  test('mobile: ReadingNav "next" navigates on the first tap after returning', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile touch regression only')

    const FIRST = '/literatura/graciliano-ramos/vidas-secas/00-00-001-mudanca'
    await page.goto(FIRST)

    const next = page.locator('.reading-nav__link--next')
    await expect(next).toBeVisible()
    const href = await next.getAttribute('href')
    expect(href, 'ReadingNav should expose a next-chapter link on chapter 1').toBeTruthy()
    const nextRe = new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')

    await next.click()
    await expect(page).toHaveURL(nextRe)

    await page.goBack()
    await expect(page).toHaveURL(/00-00-001-mudanca$/)

    // The reshaped hover is pointer-gated, so the first tap here must navigate (no
    // stuck :hover consuming it) — the tap-after-back regression class.
    await page.locator('.reading-nav__link--next').click()
    await expect(page).toHaveURL(nextRe)
  })
})
