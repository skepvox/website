import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// self-hosted Literata reading face, scoped to book chapter/segment prose.
// File-based against the built site: it proves the font ships and the CSS scope is
// correct (prose = reading font, back-link/headings/chrome = UI sans). The live
// computed-font check (incl. real 700 vs synthesized bold) is in the visual QA.
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

test.describe('reading text face', () => {
  test('the self-hosted Literata woff2 files ship (400, 700, 400-italic)', () => {
    for (const f of ['literata-400.woff2', 'literata-700.woff2', 'literata-400-italic.woff2']) {
      expect(fs.existsSync(path.join(DIST, 'fonts', f)), f).toBe(true)
    }
  })

  test('@font-face declares Literata with exact static weights and font-display: swap', () => {
    expect(css).toMatch(/@font-face\{[^}]*Literata[^}]*literata-400\.woff2/)
    expect(css).toContain('font-display:swap')
    // exact static weights, never the variable 200..900 range
    expect(css).not.toMatch(/font-weight:\s*200 900/)
    expect(css).not.toContain('font-optical-sizing')
  })

  test('--sk-reading-font is the Literata-led serif stack', () => {
    expect(css).toMatch(/--sk-reading-font:\s*["']?Literata["']?,\s*Georgia/)
  })

  test('the reading face is scoped to chapter prose under :not(.has-aside)', () => {
    expect(css).toMatch(
      /:not\(\.has-aside\)[^{]*\.vt-doc[^{]*:is\(p,\s*li,\s*blockquote,\s*dd\)\{font-family:var\(--sk-reading-font\)\}/
    )
  })

  test('the generated back-link is reset to the UI sans', () => {
    expect(css).toMatch(/\.vt-doc>div>p:first-child\{[^}]*font-family:var\(--vt-font-family-base\)/)
  })
})
