import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Semantic skepvox color-token layer. File-based against the built
// CSS bundle: it checks the token architecture, not a recolor (the values still equal
// today's green/ink — the palette is chosen in 1C-ii).
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

test.describe('color token layer', () => {
  test('the semantic color tokens are defined', () => {
    for (const t of [
      '--sk-ink:',
      '--sk-text:',
      '--sk-text-body:',
      '--sk-text-muted:',
      '--sk-text-faint:',
      '--sk-rule:',
      '--sk-surface:',
      '--sk-surface-raised:',
      '--sk-accent:',
      '--sk-accent-hover:',
      '--sk-accent-soft:',
      '--sk-accent-contrast:',
      '--sk-cue:',
      '--sk-cue-active:',
      '--sk-cue-hover:',
      '--sk-link:',
      '--sk-link-line:',
      '--sk-link-hover:'
    ]) {
      expect(css, t).toContain(t)
    }
  })

  test('--sk-reading-* remain as compatibility aliases of the new layer', () => {
    expect(css).toMatch(/--sk-reading-heading:\s*var\(--sk-text\)/)
    expect(css).toMatch(/--sk-reading-body:\s*var\(--sk-text-body\)/)
    expect(css).toMatch(/--sk-reading-muted:\s*var\(--sk-text-muted\)/)
    expect(css).toMatch(/--sk-reading-rule:\s*var\(--sk-rule\)/)
    expect(css).toMatch(/--sk-reading-accent:\s*var\(--sk-accent-soft\)/)
  })

  test('owned components consume --sk-accent, and the focus ring routes through it', () => {
    expect(css).toMatch(/--sk-focus-ring:\s*2px solid var\(--sk-accent\)/)
    expect(css).toContain('var(--sk-accent)')
  })

  test('the accent is the skepvox ink-blue and routes @vue/theme brand through it (1C-ii)', () => {
    expect(css).toMatch(/--sk-accent:\s*#2f4a6b/)
    expect(css).toMatch(/--vt-c-brand:\s*var\(--sk-accent\)/)
    expect(css).not.toMatch(/--sk-accent:\s*#42b883/)
  })

  test('the active podcast cue sources from the cue tokens and is the muted gold (not green)', () => {
    expect(css).toMatch(/vox-cue\.is-active[^{]*\{[^}]*var\(--sk-cue-active\)/)
    expect(css).toMatch(/--sk-cue:\s*181 148 84/)
    expect(css).toMatch(/--sk-cue-active:\s*rgba\(181, ?148, ?84/)
  })

  test('owned components consume the owned surface tokens', () => {
    expect(css).toContain('var(--sk-surface-raised)')
    expect(css).toContain('var(--sk-surface)')
  })
})
