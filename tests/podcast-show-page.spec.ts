import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// PodcastShowHeader "series index" masthead + the redesigned show index pages.
// File-based against the built site; the listen row is hand-maintained per page.
const DIST = path.resolve('.vitepress/dist')
const showHtml = (slug: string) =>
  fs.readFileSync(path.join(DIST, 'podcast', slug, 'index.html'), 'utf-8')

const SHOWS = [
  {
    slug: 'francais',
    title: 'Vox Français',
    count: '3 leçons',
    cards: 3,
    listen: ['Apple Podcasts', 'Spotify', 'RSS']
  },
  {
    slug: 'espanol',
    title: 'Vox Español',
    count: '2 lecciones',
    cards: 2,
    listen: ['Apple Podcasts', 'Spotify', 'RSS']
  },
  {
    slug: 'english',
    title: 'Vox English',
    count: '2 lessons',
    cards: 2,
    listen: ['Apple Podcasts', 'RSS']
  }
]

const head = (html: string) =>
  (html.match(/<header class="show-head"[\s\S]*?<\/header>/) || [''])[0]
const headText = (html: string) => head(html).replace(/<[^>]+>/g, ' ')
const listenLabels = (html: string) =>
  [...head(html).matchAll(/show-head__listen-link[^>]*>([^<]+)</g)].map((m) => m[1].trim())
const bodyText = (html: string) => {
  const m =
    html.match(/class="vt-doc[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/main>/) ||
    html.match(/class="vt-doc[^"]*"[^>]*>([\s\S]*)/)
  return (m ? m[1] : '').replace(/<[^>]+>/g, ' ')
}

test.describe('podcast show pages', () => {
  for (const show of SHOWS) {
    test(`${show.slug}: series-index masthead (eyebrow + public count, title, standfirst, listen)`, () => {
      const html = showHtml(show.slug)
      expect(html).toContain('class="show-head__eyebrow"')
      expect(headText(html)).toContain(show.count) // matches visible cards / public manifest
      expect(html).toMatch(new RegExp(`show-head__title[^>]*>\\s*${show.title}\\s*<`))
      expect(html).toContain('class="show-head__standfirst"')
      expect(listenLabels(html)).toEqual(show.listen) // refined text links, only where a URL exists
    })

    test(`${show.slug}: no Amazon, no raw URLs in body, CardGrid intact, no doc pager`, () => {
      const html = showHtml(show.slug)
      expect(html.toLowerCase()).not.toContain('music.amazon')
      expect(headText(html).toLowerCase()).not.toContain('amazon')
      expect(bodyText(html)).not.toMatch(
        /https?:\/\/(podcasts\.apple|open\.spotify|www\.skepvox\.com\/podcast[^"\s]*feed)/
      )
      expect((html.match(/card-grid__item/g) || []).length).toBe(show.cards)
      // the misleading sidebar-derived doc pager is suppressed on show pages
      expect(html).not.toContain('VPContentDocFooter')
    })
  }

  test('english show page exposes no Spotify (no source URL exists)', () => {
    const html = showHtml('english')
    expect(listenLabels(html)).not.toContain('Spotify')
    expect(html).not.toContain('open.spotify.com')
  })

  test('public lesson count matches the rendered cards', () => {
    for (const show of SHOWS) {
      const html = showHtml(show.slug)
      expect((html.match(/card-grid__item/g) || []).length).toBe(show.cards)
      expect(headText(html)).toContain(show.count)
    }
  })

  test('mobile card tap after returning from an episode navigates on the first tap', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile touch regression only')

    await page.goto('/podcast/francais/')
    await page.locator('.card-grid__link', { hasText: 'Le badge' }).click()
    await expect(page).toHaveURL(/\/podcast\/francais\/001-le-badge$/)

    await page.goBack()
    await expect(page).toHaveURL(/\/podcast\/francais\/?$/)

    await page.locator('.card-grid__link', { hasText: 'La valise verte' }).click()
    await expect(page).toHaveURL(/\/podcast\/francais\/002-la-valise-verte$/)
  })
})
