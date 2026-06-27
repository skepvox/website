import { test, expect, type Page } from '@playwright/test'
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
    listen: ['Apple Podcasts', 'Spotify']
  },
  {
    slug: 'espanol',
    title: 'Vox Español',
    count: '3 lecciones',
    cards: 3,
    listen: ['Apple Podcasts', 'Spotify']
  },
  {
    slug: 'english',
    title: 'Vox English',
    count: '2 lessons',
    cards: 2,
    listen: ['Apple Podcasts', 'Spotify']
  }
]

const head = (html: string) =>
  (html.match(/<header class="show-head"[\s\S]*?<\/header>/) || [''])[0]
const headText = (html: string) => head(html).replace(/<[^>]+>/g, ' ')
// Load the rendered header into a real DOM (via page.setContent) and return the live
// listen-link locator. Everything is asserted against the parsed DOM — locators /
// accessible name / attributes — so it is robust to attribute order, whitespace, and
// Vue's inert SSR slot-fragment comment markers, unlike a raw-HTML regex.
async function listenLinks(page: Page, slug: string) {
  await page.setContent(head(showHtml(slug)), { waitUntil: 'domcontentloaded' })
  return page.locator('.show-head__listen-link')
}
const bodyText = (html: string) => {
  const m =
    html.match(/class="vt-doc[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/main>/) ||
    html.match(/class="vt-doc[^"]*"[^>]*>([\s\S]*)/)
  return (m ? m[1] : '').replace(/<[^>]+>/g, ' ')
}

test.describe('podcast show pages', () => {
  for (const show of SHOWS) {
    test(`${show.slug}: series-index masthead (eyebrow + public count, title, standfirst, listen)`, async ({
      page
    }) => {
      const html = showHtml(show.slug)
      expect(html).toContain('class="show-head__eyebrow"')
      expect(headText(html)).toContain(show.count) // matches visible cards / public manifest
      expect(html).toMatch(new RegExp(`show-head__title[^>]*>\\s*${show.title}\\s*<`))
      expect(html).toContain('class="show-head__standfirst"')
      // Listen row — semantic DOM contract, asserted against the parsed DOM so the inert
      // SSR slot-fragment comments cannot affect the result.
      const links = await listenLinks(page, show.slug)
      await expect(links, 'exact number of listen anchors').toHaveCount(show.listen.length)
      for (let i = 0; i < show.listen.length; i++) {
        const a = links.nth(i)
        const dom = await a.evaluate((el) => ({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim(),
          childElements: el.childElementCount,
          cls: el.getAttribute('class'),
          href: el.getAttribute('href'),
          rel: el.getAttribute('rel'),
          target: el.getAttribute('target')
        }))
        expect(dom.tag, 'real <a> element, not a component artifact').toBe('a')
        // SSR fragment comments must not change visible text or accessible name.
        expect(dom.text, 'visible text equals the label').toBe(show.listen[i])
        await expect(a, 'accessible name equals the label').toHaveAccessibleName(show.listen[i])
        // no element between the <a> and its text (label is a direct text node).
        expect(dom.childElements, 'no nested wrapper element inside the link').toBe(0)
        expect(dom.cls).toContain('show-head__listen-link')
        expect(dom.href && /^https?:\/\//.test(dom.href), `${show.listen[i]} external href`).toBe(
          true
        )
        expect(dom.target).toBe('_blank')
        expect(dom.rel).toBe('noopener')
      }
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

  test('english show page exposes the restored Spotify show link', async ({ page }) => {
    const spotify = (await listenLinks(page, 'english')).filter({ hasText: /^\s*Spotify\s*$/ })
    await expect(spotify, 'exactly one Spotify listen link').toHaveCount(1)
    await expect(spotify, 'accessible name equals the label').toHaveAccessibleName('Spotify')
    await expect(spotify).toHaveAttribute(
      'href',
      'https://open.spotify.com/show/4Mlol3BnZgNRraKKspWFvf'
    )
    expect(await spotify.getAttribute('href')).not.toContain('/episode/')
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
