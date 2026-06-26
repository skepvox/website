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
    // advertência is front matter: the owned header renders its chapter (h2 "Advertência") with no
    // segment-title h3; the old part-eyebrow is gone entirely.
    await expect(page.locator('[data-testid="pseg-context"]')).toHaveCount(0)
    const head = page.locator('[data-testid="pseg-head"]')
    await expect(head.locator('h2')).toHaveText('Advertência')
    await expect(head.locator('h3')).toHaveCount(0)
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

  test('Slice C2: nav renders owned ReaderIcon chevrons + exact labels; no ‹ › ↑ glyphs (built HTML)', () => {
    const html = fs.readFileSync(
      path.join(DIST, 'louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7.html'),
      'utf-8'
    )
    const start = html.indexOf('data-testid="pseg-nav"')
    expect(start).toBeGreaterThan(-1)
    const nav = html.slice(start, html.indexOf('</nav>', start) + 6)
    // three owned reader-icon svgs (prev / next / up)
    expect((nav.match(/class="reader-icon/g) || []).length).toBeGreaterThanOrEqual(3)
    // the exact visible labels are preserved (source text; CSS uppercases the display only)
    expect(nav).toContain('Trecho anterior')
    expect(nav).toContain('Próximo trecho')
    expect(nav).toContain('Sumário')
    // the hand-rolled text glyphs are gone
    expect(nav.includes('‹')).toBe(false)
    expect(nav.includes('›')).toBe(false)
    expect(nav.includes('↑')).toBe(false)
  })

  test('Slice C2: nav chevrons are decorative; the link accessible name comes from the visible text', async ({
    page
  }) => {
    const pt = ptByOrder()
    const i = pt.findIndex((s: any) => s.segmentPrefix === '00-01-002-008')
    await page.goto(routeOf(pt[i]))
    const nav = page.locator('[data-testid="pseg-nav"]')
    for (const id of ['pseg-prev', 'pseg-next', 'pseg-up']) {
      const svg = nav.locator(`[data-testid="${id}"] svg.reader-icon`)
      await expect(svg).toHaveCount(1)
      expect(await svg.getAttribute('aria-hidden')).toBe('true') // decorative
      expect(await svg.getAttribute('focusable')).toBe('false')
    }
    await expect(nav.locator('[data-testid="pseg-prev"]')).toHaveAccessibleName(
      /Trecho anterior\s+Parágrafo 6/
    )
    await expect(nav.locator('[data-testid="pseg-next"]')).toHaveAccessibleName(
      /Próximo trecho\s+Parágrafo 8/
    )
    await expect(nav.locator('[data-testid="pseg-up"]')).toHaveAccessibleName('Sumário')
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

  test('generated pages stay idempotent; chapter/segment headings hoisted to frontmatter, prose-only body', () => {
    const out = execFileSync('python3', [GEN], { encoding: 'utf-8' })
    expect(out).toContain('No segment-routes changes.')
    const raw = fs.readFileSync(
      path.resolve('src/louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7.md'),
      'utf-8'
    )
    const fm = raw.match(/^---\n([\s\S]*?)\n---\n/)![1]
    const body = raw.replace(/^---[\s\S]*?\n---\n/, '')
    // the leading chapter/segment headings are hoisted into frontmatter for the owned reader-header
    expect(fm).toContain('pipelineChapter: "Ser"')
    expect(fm).toContain('pipelineSegmentTitle: "Parágrafo 7"')
    // ... and removed from the body, so no page renders the same heading twice
    expect(body.trimStart().startsWith('## ')).toBe(false)
    expect(body.includes('## Ser')).toBe(false)
    expect(body.includes('### Parágrafo 7')).toBe(false)
    expect(body).toContain('na simples enunciação da palavra ser') // prose preserved exactly
    expect(body.includes('Trecho anterior')).toBe(false) // nav is NOT in the page body
    expect(body.includes('pseg-nav')).toBe(false)
  })

  test('Slice B: owned reader-header renders real h2 + h3 (no vt-doc heading event); up = "Sumário"', async ({
    page
  }) => {
    const pt = ptByOrder()
    const mid = pt.find((s: any) => s.segmentPrefix === '00-02-001-051') // "Distinção" / "Parágrafo 50"
    await page.goto(routeOf(mid))
    // the owned header carries the chapter (h2) + segment (h3), same text as the source headings
    const head = page.locator('[data-testid="pseg-head"]')
    await expect(head.locator('h2')).toHaveText('Distinção')
    await expect(head.locator('h3')).toHaveText('Parágrafo 50')
    // exactly one real h2 + one real h3 on the page (SEO outline preserved), and NOT in the prose body
    await expect(page.locator('.VPContentDoc h2')).toHaveCount(1)
    await expect(page.locator('.VPContentDoc h3')).toHaveCount(1)
    await expect(page.locator('.VPContentDoc .vt-doc h2')).toHaveCount(0)
    await expect(page.locator('.VPContentDoc .vt-doc h3')).toHaveCount(0)
    // the chapter kicker is calm: uppercase, below the dominant ~17px prose, with no accent bar
    const m = await head.locator('h2').evaluate((el) => {
      const p = document.querySelector('.VPContentDoc .vt-doc p') as HTMLElement
      return {
        transform: getComputedStyle(el).textTransform,
        before: getComputedStyle(el, '::before').content,
        h2px: parseFloat(getComputedStyle(el).fontSize),
        prosePx: parseFloat(getComputedStyle(p).fontSize)
      }
    })
    expect(m.transform).toBe('uppercase')
    expect(m.before).toBe('none') // no accent-bar pseudo-element on the owned kicker
    expect(m.h2px).toBeLessThan(m.prosePx)
    expect(m.prosePx).toBeGreaterThan(16)
    // the up link reads "Sumário" (unified with the hub), never "Índice"
    const up = page.locator('[data-testid="pseg-up"]')
    await expect(up).toContainText('Sumário')
    await expect(up).not.toContainText('Índice')
  })

  test('scope guard: legacy reading pages (de-l-acte) keep their chapter-opener h2 (accent bar intact)', async ({
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
