import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

// Slice 2O — owned prev/next/up navigation for the live pt segment leaves (PipelineSegmentNav).
// Injected via the theme content slots (page bodies untouched), self-gated by the
// `generated: pipeline-segment-routes` frontmatter marker, joining pipeline-export-segments.json by
// (canonicalId, language). Never crosses edition/language; uses SkLink; absent everywhere else.
const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const GEN = path.resolve('scripts/build-pipeline-segment-routes.py')
const COMP = path.resolve('.vitepress/theme/components/PipelineSegmentNav.vue')
const HUB = '/louis-lavelle/introducao-a-ontologia/'

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const ptByOrder = () =>
  read(META)
    .segments.filter((s: any) => s.language === 'pt')
    .sort((a: any, b: any) => a.order - b.order)
const routeOf = (s: any) => `/${s.routePath}`

function builtExists(href: string): boolean {
  const h = href.replace(/\/$/, '') || '/'
  if (h === '/') return fs.existsSync(path.join(DIST, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${h}.html`)) || fs.existsSync(path.join(DIST, h, 'index.html'))
  )
}

test.describe('pipeline pt segment nav (Slice 2O, owned prev/next/up, pipeline-sourced)', () => {
  test('first segment (front matter): next-only + up, no part-eyebrow (no prev)', async ({
    page
  }) => {
    const pt = ptByOrder()
    await page.goto(routeOf(pt[0]))
    // advertência is front matter (no part) → no orientation eyebrow (Slice A: part-only eyebrow)
    await expect(page.locator('[data-testid="pseg-context"]')).toHaveCount(0)
    const nav = page.locator('[data-testid="pseg-nav"]')
    await expect(nav).toBeVisible()
    await expect(nav.locator('[data-testid="pseg-prev"]')).toHaveCount(0)
    await expect(nav.locator('[data-testid="pseg-next"]')).toHaveCount(1)
    await expect(nav.locator('[data-testid="pseg-up"]')).toHaveCount(1)
    await expect(nav.locator('[data-testid="pseg-next"]')).toHaveAttribute('href', routeOf(pt[1]))
  })

  test('middle segment: prev + next + up, all pointing to pt routes', async ({ page }) => {
    const pt = ptByOrder()
    const i = pt.findIndex((s: any) => s.segmentPrefix === '00-01-002-008')
    await page.goto(routeOf(pt[i]))
    const nav = page.locator('[data-testid="pseg-nav"]')
    await expect(nav.locator('[data-testid="pseg-prev"]')).toHaveAttribute(
      'href',
      routeOf(pt[i - 1])
    )
    await expect(nav.locator('[data-testid="pseg-next"]')).toHaveAttribute(
      'href',
      routeOf(pt[i + 1])
    )
    // up returns to the hub, carrying the current trecho so the hub can open + highlight it
    await expect(nav.locator('[data-testid="pseg-up"]')).toHaveAttribute(
      'href',
      `${HUB}#trecho-00-01-002-008`
    )
    // rel discipline (prev/next semantics)
    await expect(nav.locator('[data-testid="pseg-prev"]')).toHaveAttribute('rel', 'prev')
    await expect(nav.locator('[data-testid="pseg-next"]')).toHaveAttribute('rel', 'next')
    // the eyebrow orients by work · part only — the chapter ("Ser") is the page <h2>, not duplicated
    const ctx = (await page.locator('[data-testid="pseg-context"]').innerText()).trim()
    expect(ctx).toContain('Primeira parte')
    expect(ctx).not.toContain('Ser')
    expect(ctx).not.toContain(' / ')
  })

  test('last segment: prev-only + up (no next)', async ({ page }) => {
    const pt = ptByOrder()
    await page.goto(routeOf(pt[pt.length - 1]))
    const nav = page.locator('[data-testid="pseg-nav"]')
    await expect(nav.locator('[data-testid="pseg-prev"]')).toHaveCount(1)
    await expect(nav.locator('[data-testid="pseg-next"]')).toHaveCount(0)
    await expect(nav.locator('[data-testid="pseg-up"]')).toHaveCount(1)
    await expect(nav.locator('[data-testid="pseg-prev"]')).toHaveAttribute(
      'href',
      routeOf(pt[pt.length - 2])
    )
  })

  test('every nav href resolves to a built pt public page — no fr / old chapter / reading-review', async ({
    page
  }) => {
    const pt = ptByOrder()
    const i = pt.findIndex((s: any) => s.segmentPrefix === '00-01-002-008')
    await page.goto(routeOf(pt[i]))
    const nav = page.locator('[data-testid="pseg-nav"]')
    const hrefs = await Promise.all(
      ['pseg-prev', 'pseg-next', 'pseg-up'].map((id) =>
        nav.locator(`[data-testid="${id}"]`).getAttribute('href')
      )
    )
    for (const href of hrefs) {
      expect(href).toBeTruthy()
      const noHash = href!.split('#')[0] // the up link carries a #trecho-<prefix> fragment
      expect(builtExists(noHash), `${noHash} built`).toBe(true)
      expect(href!.includes('introduction-a-l-ontologie')).toBe(false) // no fr / old chapter route
      expect(href!.includes('reading-review')).toBe(false)
      expect(
        noHash === HUB || noHash.startsWith('/louis-lavelle/introducao-a-ontologia/'),
        `${href} is pt namespace`
      ).toBe(true)
    }
  })

  test('the nav is absent on non-pipeline-leaf pages', async ({ page }) => {
    for (const route of [
      '/louis-lavelle/introduction-a-l-ontologie/00-01-002-etre', // old fr chapter (preview serves it)
      '/reading-review/introduction-a-l-ontologie-reader', // reading-review demo
      '/louis-lavelle/introducao-a-ontologia/', // the pt hub (pipeline-work-hub marker, not -routes)
      '/podcast/', // podcast
      '/' // home
    ]) {
      await page.goto(route)
      await expect(page.locator('[data-testid="pseg-nav"]'), route).toHaveCount(0)
      await expect(page.locator('[data-testid="pseg-context"]'), route).toHaveCount(0)
    }
  })

  test('SkLink + focus/hover discipline is preserved', () => {
    const src = fs.readFileSync(COMP, 'utf-8')
    expect(src).toContain("import SkLink from './SkLink.vue'")
    // all links go through SkLink (no raw <a> in the template)
    expect(src.includes('<a ')).toBe(false)
    // visible hover is pointer-gated; keyboard focus is owned by SkLink (no per-component focus rule)
    expect(src).toContain('@media (hover: hover) and (pointer: fine)')
    expect(src.includes(':focus-visible')).toBe(false)
  })

  test('generated pages stay idempotent and prose-only (the nav is theme-injected, not in the body)', () => {
    const out = execFileSync('python3', [GEN], { encoding: 'utf-8' })
    expect(out).toContain('No segment-routes changes.')
    const body = fs
      .readFileSync(
        path.resolve('src/louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7.md'),
        'utf-8'
      )
      .replace(/^---[\s\S]*?\n---\n/, '')
    expect(body).toContain('na simples enunciação da palavra ser') // prose intact
    expect(body.includes('Trecho anterior')).toBe(false) // nav is NOT in the page body
    expect(body.includes('pseg-nav')).toBe(false)
  })

  test('Slice A: leaf chapter heading is a calm kicker below the prose (no accent bar); up = "Sumário"', async ({
    page
  }) => {
    const pt = ptByOrder()
    const mid = pt.find((s: any) => s.segmentPrefix === '00-02-001-051') // "Distinção" chapter (h2 + h3)
    await page.goto(routeOf(mid))
    const h2 = page.locator('.VPContentDoc .vt-doc h2').first()
    await expect(h2).toBeVisible()
    const m = await h2.evaluate((el) => {
      const cs = getComputedStyle(el)
      const before = getComputedStyle(el, '::before')
      const p = document.querySelector('.VPContentDoc .vt-doc p') as HTMLElement
      return {
        h2px: parseFloat(cs.fontSize),
        transform: cs.textTransform,
        before: before.display,
        prosePx: parseFloat(getComputedStyle(p).fontSize)
      }
    })
    expect(m.before).toBe('none') // the chapter-opener accent bar is gone
    expect(m.transform).toBe('uppercase') // chapter demoted to a small-caps kicker
    expect(m.h2px).toBeLessThan(m.prosePx) // the chapter no longer out-sizes the prose
    expect(m.prosePx).toBeGreaterThan(16) // prose bumped to ~17px (the largest reading element)
    // the up link now reads "Sumário" (unified with the hub), never "Índice"
    const up = page.locator('[data-testid="pseg-up"]')
    await expect(up).toContainText('Sumário')
    await expect(up).not.toContainText('Índice')
  })

  test('Slice A scope: legacy reading pages (de-l-acte) keep their chapter-opener h2 (accent bar intact)', async ({
    page
  }) => {
    await page.goto('/louis-lavelle/de-l-acte')
    const h2 = page.locator('.VPContentDoc .vt-doc h2').first()
    await expect(h2).toBeVisible()
    const before = await h2.evaluate((el) => getComputedStyle(el, '::before').display)
    expect(before).not.toBe('none') // unscoped pages keep the accent bar — no other book touched
  })

  test('performance boundary: each leaf carries only its own prose (no all-99 prose bundle)', () => {
    const html = (leaf: string) =>
      fs.readFileSync(path.join(DIST, `louis-lavelle/introducao-a-ontologia/${leaf}.html`), 'utf-8')
    const adv = html('00-00-000-001-advertencia')
    const p7 = html('00-01-002-008-paragrafo-7')
    const advPhrase = 'duas conferências proferidas' // distinctive to Advertência
    const p7Phrase = 'na simples enunciação da palavra ser' // distinctive to Parágrafo 7
    // each leaf has ITS OWN prose ...
    expect(adv.includes(advPhrase)).toBe(true)
    expect(p7.includes(p7Phrase)).toBe(true)
    // ... and never another segment's prose (no all-segments bundle leaks onto any leaf)
    expect(adv.includes(p7Phrase)).toBe(false)
    expect(p7.includes(advPhrase)).toBe(false)
  })
})
