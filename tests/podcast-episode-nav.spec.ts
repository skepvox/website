import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Slice 2B — owned PodcastEpisodeNav (docs/sidebar-local-nav-model.md). A calm within-show
// prev/next pager rendered in the content-bottom slot on podcast EPISODE leaves only. It
// restores correct episode progression after Slice 1's footer:false removed the wrong
// sidebar-derived pager, and it never crosses a show/corpus boundary. File-based against the
// built site (same approach as reading-nav.spec / podcast-show-page.spec).
const DIST = path.resolve('.vitepress/dist')
const html = (rel: string) => fs.readFileSync(path.join(DIST, rel), 'utf-8')
const exists = (rel: string) => fs.existsSync(path.join(DIST, rel))

// Public episode slugs per show, in order (the public manifest; buffers excluded upstream).
const EPISODES: Record<string, string[]> = {
  francais: ['001-le-badge', '002-la-valise-verte', '003-le-covoiturage-poli'],
  espanol: ['001-la-boda-es-a-las-seis', '002-la-sarten-esta-ocupada'],
  english: ['001-the-two-minute-phone-call', '002-the-bowl-of-something']
}
const NAV_RE = /<nav class="episode-nav"[\s\S]*?<\/nav>/
const block = (page: string) => (page.match(NAV_RE) || [null])[0]
const blockText = (b: string) =>
  b
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const blockHrefs = (b: string) => [...b.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
const episodeHtml = (show: string, slug: string) => html(`podcast/${show}/${slug}.html`)

test.describe('PodcastEpisodeNav — owned within-show episode pager', () => {
  test('renders on every public podcast episode page', () => {
    for (const [show, slugs] of Object.entries(EPISODES)) {
      for (const slug of slugs) {
        expect(block(episodeHtml(show, slug)), `${show}/${slug}`).toBeTruthy()
      }
    }
  })

  test('is absent on show pages, podcast hub, book leaves, hubs, and home', () => {
    const off = [
      'podcast/index.html',
      'podcast/francais/index.html',
      'podcast/espanol/index.html',
      'podcast/english/index.html',
      'literatura/index.html',
      'literatura/machado-de-assis/index.html',
      'literatura/machado-de-assis/bras-cubas.html',
      'literatura/graciliano-ramos/vidas-secas/00-00-001-mudanca.html',
      // the live pt reader (the legacy /louis-lavelle/ book pages were removed in A5)
      'pt/filosofia/louis-lavelle/index.html', // author hub
      'pt/filosofia/louis-lavelle/introducao-a-ontologia/index.html', // work hub
      'pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.html', // a reader leaf
      'index.html'
    ]
    for (const rel of off) {
      expect(html(rel), rel).not.toContain('episode-nav')
    }
  })

  test('Vox Français first / middle / last behaviour is correct', () => {
    const first = block(episodeHtml('francais', '001-le-badge'))!
    expect(blockText(first)).toContain('Suivant')
    expect(blockText(first)).not.toContain('Précédent')
    expect(blockHrefs(first)).toEqual(['/podcast/francais/002-la-valise-verte'])

    const mid = block(episodeHtml('francais', '002-la-valise-verte'))!
    expect(blockText(mid)).toContain('Précédent')
    expect(blockText(mid)).toContain('Suivant')
    expect(blockHrefs(mid)).toEqual([
      '/podcast/francais/001-le-badge',
      '/podcast/francais/003-le-covoiturage-poli'
    ])

    const last = block(episodeHtml('francais', '003-le-covoiturage-poli'))!
    expect(blockText(last)).toContain('Précédent')
    expect(blockText(last)).not.toContain('Suivant')
    expect(blockHrefs(last)).toEqual(['/podcast/francais/002-la-valise-verte'])
  })

  test('English and Spanish labels are used on their shows', () => {
    const en = block(episodeHtml('english', '001-the-two-minute-phone-call'))!
    expect(blockText(en)).toContain('Next')
    expect(blockText(en)).not.toContain('Suivant')
    const enLast = block(episodeHtml('english', '002-the-bowl-of-something'))!
    expect(blockText(enLast)).toContain('Previous')
    expect(blockText(enLast)).not.toContain('Next')

    const es = block(episodeHtml('espanol', '001-la-boda-es-a-las-seis'))!
    expect(blockText(es)).toContain('Siguiente')
    const esLast = block(episodeHtml('espanol', '002-la-sarten-esta-ocupada'))!
    expect(blockText(esLast)).toContain('Anterior')
    expect(blockText(esLast)).not.toContain('Siguiente')
  })

  test('never links across shows, never to a non-public episode, and hrefs resolve', () => {
    for (const [show, slugs] of Object.entries(EPISODES)) {
      const publicHrefs = new Set(slugs.map((s) => `/podcast/${show}/${s}`))
      for (const slug of slugs) {
        const b = block(episodeHtml(show, slug))!
        for (const href of blockHrefs(b)) {
          expect(href, `${show}/${slug} -> ${href}`).toMatch(new RegExp(`^/podcast/${show}/`))
          expect(publicHrefs.has(href), `public-only: ${href}`).toBe(true)
          expect(exists(`${href.replace(/^\//, '')}.html`), `resolves: ${href}`).toBe(true)
        }
      }
    }
  })

  test('links are real anchors rendered via SkLink, and the doc pager stays retired', () => {
    const b = block(episodeHtml('francais', '002-la-valise-verte'))!
    // SkLink renders a real <a> (transparent wrapper) for each direction
    expect((b.match(/<a\b/g) || []).length).toBe(2)
    expect(b).toContain('rel="prev"')
    expect(b).toContain('rel="next"')
    // the rented sidebar-derived pager remains absent on episode pages (Slice 1)
    expect(episodeHtml('francais', '002-la-valise-verte')).not.toContain('VPContentDocFooter')
  })

  test('hover is pointer-gated and focus/pressed are delegated to SkLink', () => {
    const src = fs.readFileSync(
      path.resolve('.vitepress/theme/components/PodcastEpisodeNav.vue'),
      'utf-8'
    )
    expect(src).toContain("import SkLink from './SkLink.vue'")
    expect(src).toContain('<SkLink')
    // visible hover sits inside the pointer media query
    const media = src.indexOf('@media (hover: hover) and (pointer: fine)')
    const hover = src.indexOf('color: var(--sk-reading-heading)')
    expect(media).toBeGreaterThan(-1)
    expect(hover).toBeGreaterThan(media)
    // no per-component focus ring: SkLink owns it
    expect(src).not.toMatch(/:focus-visible\s*\{/)
  })
})
