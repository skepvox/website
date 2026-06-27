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

  // After the SkLink slice the keyboard focus ring for these links is owned by the SkLink
  // primitive (the anchors are wrapped in <SkLink>), not declared per-component. The
  // guarantee is unchanged — assert the links go through SkLink AND that SkLink ships the
  // tokenised ring. (The built bundle still containing `outline: var(--sk-focus-ring)` is
  // also locked by 'focus-ring tokens are defined and consumed' above.)
  test('PodcastShowHeader listen links get the keyboard focus ring via SkLink', () => {
    const show = fs.readFileSync(
      path.resolve('.vitepress/theme/components/PodcastShowHeader.vue'),
      'utf-8'
    )
    const sk = fs.readFileSync(path.resolve('.vitepress/theme/components/SkLink.vue'), 'utf-8')
    expect(show).toContain('<SkLink')
    expect(sk).toMatch(/a:focus-visible\s*\{[^}]*var\(--sk-focus-ring\)/)
  })

  test('the reader segment nav prev/next links get the keyboard focus ring via SkLink', () => {
    // Repointed from the retired legacy ReadingNav (B5) to the live PipelineSegmentNav.
    const nav = fs.readFileSync(
      path.resolve('.vitepress/theme/components/PipelineSegmentNav.vue'),
      'utf-8'
    )
    const sk = fs.readFileSync(path.resolve('.vitepress/theme/components/SkLink.vue'), 'utf-8')
    expect(nav).toContain('<SkLink')
    expect(sk).toMatch(/a:focus-visible\s*\{[^}]*var\(--sk-focus-ring\)/)
  })

  test('vox-cue keeps its own focus ring; cards + home pillars delegate it to SkLink', () => {
    // vox-cue (the synced-transcript cue) is not a link and keeps its own ring.
    expect(css).toMatch(/vox-cue[^{]*:focus-visible/)
    // CardGrid + Home now get their keyboard focus ring from the SkLink primitive.
    const cardGrid = fs.readFileSync(
      path.resolve('.vitepress/theme/components/CardGrid.vue'),
      'utf-8'
    )
    const home = fs.readFileSync(path.resolve('.vitepress/theme/components/Home.vue'), 'utf-8')
    const sk = fs.readFileSync(path.resolve('.vitepress/theme/components/SkLink.vue'), 'utf-8')
    expect(cardGrid).toContain('<SkLink')
    expect(home).toContain('<SkLink')
    expect(sk).toMatch(/a:focus-visible\s*\{[^}]*var\(--sk-focus-ring\)/)
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

  // Slice 1B — owned components now consume the tokens (not just define them).
  test('owned components consume the semantic tokens', () => {
    for (const usage of [
      'var(--sk-text-',
      'var(--sk-space-',
      'var(--sk-motion-base)',
      'var(--sk-card-radius)',
      'var(--sk-masthead)',
      'var(--sk-measure-lede)'
    ]) {
      expect(css, usage).toContain(usage)
    }
  })
})
