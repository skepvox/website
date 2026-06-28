import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { LAVELLE_WORK_ID, workSegments } from './pipeline-helpers'

const DIST = path.resolve('.vitepress/dist')
const META = path.resolve('.vitepress/theme/data/pipeline-export-segments.json')
const GEN = path.resolve('scripts/build-pipeline-segment-routes.py')
const COMP = path.resolve('.vitepress/theme/components/PipelineSegmentNav.vue')
const HUB = '/pt/filosofia/louis-lavelle/introducao-a-ontologia/'

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const ptByOrder = () => workSegments(read(META).segments, LAVELLE_WORK_ID, 'pt')
const routeOf = (s: any) => `/${s.routePath}`

function builtExists(href: string): boolean {
  const h = href.replace(/\/$/, '') || '/'
  if (h === '/') return fs.existsSync(path.join(DIST, 'index.html'))
  return (
    fs.existsSync(path.join(DIST, `${h}.html`)) || fs.existsSync(path.join(DIST, h, 'index.html'))
  )
}

test.describe('pipeline pt segment nav (owned prev/next/up, pipeline-sourced)', () => {
  test('first segment (front matter): next-only + up, no part-eyebrow (no prev)', async ({
    page
  }) => {
    const pt = ptByOrder()
    await page.goto(routeOf(pt[0]))
    await expect(page.locator('[data-testid="pseg-context"]')).toHaveCount(0)
    const head = page.locator('[data-testid="pseg-head"]')
    await expect(head).toHaveAttribute('aria-label', 'Localização')
    await expect(head.locator('h2')).toHaveCount(0)
    await expect(head.locator('h3')).toHaveText('Advertência')
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
    await expect(nav.locator('[data-testid="pseg-up"]')).toHaveAttribute(
      'href',
      `${HUB}#trecho-00-01-002-008`
    )
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
      const noHash = href!.split('#')[0]
      expect(builtExists(noHash), `${noHash} built`).toBe(true)
      expect(href!.includes('introduction-a-l-ontologie')).toBe(false)
      expect(href!.includes('reading-review')).toBe(false)
      expect(
        noHash === HUB || noHash.startsWith('/pt/filosofia/louis-lavelle/introducao-a-ontologia/'),
        `${href} is pt namespace`
      ).toBe(true)
    }
  })

  test('nav renders owned ReaderIcon chevrons + exact labels; no ‹ › ↑ glyphs (built HTML)', () => {
    const html = fs.readFileSync(
      path.join(DIST, 'pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.html'),
      'utf-8'
    )
    const start = html.indexOf('data-testid="pseg-nav"')
    expect(start).toBeGreaterThan(-1)
    const nav = html.slice(start, html.indexOf('</nav>', start) + 6)
    expect((nav.match(/class="reader-icon/g) || []).length).toBeGreaterThanOrEqual(3)
    expect(nav).toContain('Anterior')
    expect(nav).toContain('Próximo')
    expect(nav).toContain('Sumário')
    expect(nav.includes('Trecho anterior')).toBe(false)
    expect(nav.includes('Próximo trecho')).toBe(false)
    expect(nav.includes('‹')).toBe(false)
    expect(nav.includes('›')).toBe(false)
    expect(nav.includes('↑')).toBe(false)
  })

  test('nav chevrons are decorative; the link accessible name comes from the visible text', async ({
    page
  }) => {
    const pt = ptByOrder()
    const i = pt.findIndex((s: any) => s.segmentPrefix === '00-01-002-008')
    await page.goto(routeOf(pt[i]))
    const nav = page.locator('[data-testid="pseg-nav"]')
    for (const id of ['pseg-prev', 'pseg-next', 'pseg-up']) {
      const svg = nav.locator(`[data-testid="${id}"] svg.reader-icon`)
      await expect(svg).toHaveCount(1)
      expect(await svg.getAttribute('aria-hidden')).toBe('true')
      expect(await svg.getAttribute('focusable')).toBe('false')
    }
    await expect(nav.locator('[data-testid="pseg-prev"]')).toHaveAccessibleName(
      /Anterior\s+Parágrafo 6/
    )
    await expect(nav.locator('[data-testid="pseg-next"]')).toHaveAccessibleName(
      /Próximo\s+Parágrafo 8/
    )
    await expect(nav.locator('[data-testid="pseg-up"]')).toHaveAccessibleName('Sumário')
  })

  test('polish: the bottom Sumário up-link shares the Anterior/Próximo nav-label style + keeps its #trecho href', async ({
    page
  }) => {
    const pt = ptByOrder()
    const i = pt.findIndex((s: any) => s.segmentPrefix === '00-01-002-008')
    await page.goto(routeOf(pt[i]))
    const nav = page.locator('[data-testid="pseg-nav"]')
    const styleOf = (sel: string) =>
      nav
        .locator(sel)
        .first()
        .evaluate((el) => {
          const s = getComputedStyle(el)
          return { tt: s.textTransform, weight: s.fontWeight }
        })
    const dir = await styleOf('.pseg-nav__dir')
    const up = await styleOf('.pseg-nav__up-link')
    expect(up.tt).toBe('uppercase')
    expect(up.tt).toBe(dir.tt)
    expect(up.weight).toBe(dir.weight)
    await expect(nav.locator('[data-testid="pseg-up"]')).toHaveAttribute(
      'href',
      '/pt/filosofia/louis-lavelle/introducao-a-ontologia/#trecho-00-01-002-008'
    )
  })

  test('the nav is absent on non-pipeline-leaf pages', async ({ page }) => {
    for (const route of [
      '/louis-lavelle/introduction-a-l-ontologie/00-01-002-etre',
      '/reading-review/introduction-a-l-ontologie-reader',
      '/pt/filosofia/louis-lavelle/introducao-a-ontologia/',
      '/podcast/',
      '/'
    ]) {
      await page.goto(route)
      await expect(page.locator('[data-testid="pseg-nav"]'), route).toHaveCount(0)
      await expect(page.locator('[data-testid="pseg-context"]'), route).toHaveCount(0)
    }
  })

  test('SkLink + focus/hover discipline is preserved', () => {
    const src = fs.readFileSync(COMP, 'utf-8')
    expect(src).toContain("import SkLink from './SkLink.vue'")
    expect(src.includes('<a ')).toBe(false)
    expect(src).toContain('@media (hover: hover) and (pointer: fine)')
    expect(src.includes(':focus-visible')).toBe(false)
  })

  test('generated pages stay idempotent; chapter/segment headings hoisted to frontmatter, prose-only body', () => {
    const out = execFileSync('python3', [GEN], { encoding: 'utf-8' })
    expect(out).toContain('No segment-routes changes.')
    const raw = fs.readFileSync(
      path.resolve('src/pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.md'),
      'utf-8'
    )
    const fm = raw.match(/^---\n([\s\S]*?)\n---\n/)![1]
    const body = raw.replace(/^---[\s\S]*?\n---\n/, '')
    expect(fm).toContain('pipelineChapter: "Ser"')
    expect(fm).toContain('pipelineSegmentTitle: "Parágrafo 7"')
    expect(body.trimStart().startsWith('## ')).toBe(false)
    expect(body.includes('## Ser')).toBe(false)
    expect(body.includes('### Parágrafo 7')).toBe(false)
    expect(body).toContain('na simples enunciação da palavra ser')
    expect(body.includes('data-pipeline-nav')).toBe(false)
    expect(body.includes('pseg-nav')).toBe(false)
  })

  test('owned reader-header renders real h2 + h3 (no vt-doc heading event); up = "Sumário"', async ({
    page
  }) => {
    const pt = ptByOrder()
    const mid = pt.find((s: any) => s.segmentPrefix === '00-02-001-051')
    await page.goto(routeOf(mid))
    const head = page.locator('[data-testid="pseg-head"]')
    await expect(head.locator('h2')).toHaveText('Distinção')
    await expect(head.locator('h3')).toHaveText('Parágrafo 50')
    await expect(page.locator('.VPContentDoc h2')).toHaveCount(1)
    await expect(page.locator('.VPContentDoc h3')).toHaveCount(1)
    await expect(page.locator('.VPContentDoc .vt-doc h2')).toHaveCount(0)
    await expect(page.locator('.VPContentDoc .vt-doc h3')).toHaveCount(0)
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
    expect(m.before).toBe('none')
    expect(m.h2px).toBeLessThan(m.prosePx)
    expect(m.prosePx).toBeGreaterThan(16)
    const up = page.locator('[data-testid="pseg-up"]')
    await expect(up).toContainText('Sumário')
    await expect(up).not.toContainText('Índice')
  })

  test('the heading accent bar is removed from authored .vt-doc markdown headings', async ({
    page
  }) => {
    await page.goto('/podcast/')
    const h2 = page.locator('.VPContentDoc .vt-doc h2').first()
    await expect(h2).toBeVisible()
    const before = await h2.evaluate((el) => getComputedStyle(el, '::before').content)
    expect(before).toBe('none')
  })

  test('performance boundary: each leaf carries only its own prose (no all-99 prose bundle)', () => {
    const html = (leaf: string) =>
      fs.readFileSync(
        path.join(DIST, `pt/filosofia/louis-lavelle/introducao-a-ontologia/${leaf}.html`),
        'utf-8'
      )
    const adv = html('00-00-000-001')
    const p7 = html('00-01-002-008')
    const advPhrase = 'duas conferências proferidas'
    const p7Phrase = 'na simples enunciação da palavra ser'
    expect(adv.includes(advPhrase)).toBe(true)
    expect(p7.includes(p7Phrase)).toBe(true)
    expect(adv.includes(p7Phrase)).toBe(false)
    expect(p7.includes(advPhrase)).toBe(false)
  })
})
