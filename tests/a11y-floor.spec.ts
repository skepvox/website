import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice 1A — additive semantic tokens + the global focus / reduced-motion floor.
// File-based against the built CSS bundle (the same approach as the other specs): it
// asserts the shipped CSS, not a live browser focus simulation, which keeps it stable.
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

test.describe('a11y floor (Slice 1A)', () => {
  test('global reduced-motion floor is shipped', () => {
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/)
    // distinctive declarations of the floor (survive minification)
    expect(css).toMatch(/animation-iteration-count:\s*1\s*!important/)
    expect(css).toMatch(/transition-duration:\s*0?\.01ms\s*!important/)
  })

  test('focus-ring tokens are defined and consumed', () => {
    expect(css).toContain('--sk-focus-ring:')
    expect(css).toContain('--sk-focus-offset:')
    expect(css).toMatch(/outline:\s*var\(--sk-focus-ring\)/)
  })

  test('PodcastShowHeader listen links have a keyboard-visible focus ring', () => {
    // covers the regular and the .is-secondary (RSS) variant — both are this class
    expect(css).toMatch(/show-head__listen-link[^{]*:focus-visible/)
  })

  test('ReadingNav prev/next links have a keyboard-visible focus ring', () => {
    expect(css).toMatch(/reading-nav__link[^{]*:focus-visible/)
  })

  test('existing focus surfaces are not broken (cards, home pillars, cues)', () => {
    for (const selector of ['card-grid__link', 'vt-box', 'vox-cue']) {
      expect(css, selector).toMatch(new RegExp(`${selector}[^{]*:focus-visible`))
    }
  })

  test('the additive token groups are present', () => {
    for (const token of [
      '--sk-text-',
      '--sk-space-',
      '--sk-motion-',
      '--sk-radius-',
      '--sk-card-',
      '--sk-measure-prose:',
      '--sk-measure-lede:'
    ]) {
      expect(css, token).toContain(token)
    }
  })
})
