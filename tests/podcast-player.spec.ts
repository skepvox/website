import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Regression guard for the synced-transcript PodcastPlayer. Anchored on a real
// built episode page so it catches the durability failure mode (page sync
// dropping the player wiring) and the transcript SSR / LLM rendering.
const PAGE_PATH = '/podcast/francais/001-le-badge'
const CUES_FILE = path.resolve('src/podcast/francais/001-le-badge.cues.json')
const DIST_HTML = path.resolve('.vitepress/dist/podcast/francais/001-le-badge.html')
const LLMS_FILE = path.resolve('.vitepress/dist/llms-full.txt')
const RENDER_MARKER = '<!-- Rendered for LLM outputs from synced cue JSON. -->'

interface Cue {
  id: string
  start: number
  end: number
  text: string
}

function loadCues(): Cue[] {
  const data = JSON.parse(fs.readFileSync(CUES_FILE, 'utf-8'))
  const cues: Cue[] = []
  for (const section of data.sections) {
    for (const paragraph of section.paragraphs) {
      for (const cue of paragraph.cues) cues.push(cue)
    }
  }
  return cues
}

// A long, HTML-safe cue from the middle of the transcript, used to assert the
// transcript text actually reaches the SSR HTML and the LLM output.
function sampleTranscriptText(): string {
  const cues = loadCues()
    .slice(15, -15)
    .filter((cue) => cue.text.length >= 12)
    .sort((a, b) => b.text.length - a.text.length)
  if (!cues.length) throw new Error('no transcript sample found')
  return cues[0].text
}

// Match Vue's SSR text escaping so the assertion holds for any cue text.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// A mid-list cue with a comfortable gap to its successor, so the player's 0.15s
// visual-sync offset lands unambiguously inside it.
function safeHighlightCue(): Cue {
  const cues = loadCues()
  for (let i = 10; i < cues.length - 1; i++) {
    if (cues[i + 1].start - cues[i].start > 0.6) return cues[i]
  }
  return cues[Math.floor(cues.length / 2)]
}

test.describe('podcast player', () => {
  test('renders the transcript server-side', async () => {
    const html = fs.readFileSync(DIST_HTML, 'utf-8')
    expect(html).toContain('class="vox-transcript"')
    const cueSpans = (html.match(/class="vox-cue/g) || []).length
    expect(cueSpans).toBeGreaterThan(50)
    expect(html).toContain(escapeHtml(sampleTranscriptText()))
  })

  test('renders the transcript into llms-full.txt', async () => {
    const llms = fs.readFileSync(LLMS_FILE, 'utf-8')
    expect(llms).toContain(RENDER_MARKER)
    expect(llms).toContain(sampleTranscriptText())
  })

  test('has no horizontal overflow', async ({ page }) => {
    await page.goto(PAGE_PATH)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('logs no application console errors', async ({ page }) => {
    const errors: string[] = []
    const isExternalNoise = (text: string) =>
      /media\.skepvox\.com|googletagmanager\.com|google-analytics\.com|gtag|Failed to load resource/i.test(
        text
      )
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isExternalNoise(msg.text())) errors.push(msg.text())
    })
    page.on('pageerror', (err) => {
      if (!isExternalNoise(String(err))) errors.push(String(err))
    })
    await page.goto(PAGE_PATH)
    await page.mouse.wheel(0, 1600)
    await page.waitForTimeout(300)
    expect(errors).toEqual([])
  })

  test('highlights the cue matching the audio time', async ({ page }) => {
    await page.goto(PAGE_PATH)
    const cue = safeHighlightCue()
    await page.evaluate((c) => {
      const audio = document.querySelector('.vox-player__audio') as HTMLMediaElement
      // Force a deterministic playhead without loading remote media.
      Object.defineProperty(audio, 'currentTime', {
        configurable: true,
        get: () => c.start + 0.2,
        set: () => {}
      })
      audio.dispatchEvent(new Event('timeupdate'))
    }, cue)
    await expect(page.locator(`[data-cue="${cue.id}"]`)).toHaveClass(/is-active/)
  })

  test('seeks and highlights the cue on click', async ({ page }) => {
    await page.goto(PAGE_PATH)
    const cues = loadCues()
    const cue = cues[Math.min(12, cues.length - 1)]
    const span = page.locator(`[data-cue="${cue.id}"]`)
    await span.click()
    await expect(span).toHaveClass(/is-active/)
    await expect(span).toHaveAttribute('aria-current', 'true')
  })

  test('pins the player bar on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile viewport only')
    await page.goto(PAGE_PATH)
    await page.locator('.vox-transcript').scrollIntoViewIfNeeded()
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(300)
    await expect(page.locator('.vox-player.is-pinned')).toHaveCount(1)
    const position = await page.evaluate(
      () => getComputedStyle(document.querySelector('.vox-player__bar') as HTMLElement).position
    )
    expect(position).toBe('fixed')
  })

  test('keeps the player bar sticky on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop viewport only')
    await page.goto(PAGE_PATH)
    const position = await page.evaluate(
      () => getComputedStyle(document.querySelector('.vox-player__bar') as HTMLElement).position
    )
    expect(['sticky', '-webkit-sticky']).toContain(position)
    await page.mouse.wheel(0, 1400)
    await page.waitForTimeout(300)
    const top = await page.evaluate(
      () => (document.querySelector('.vox-player__bar') as HTMLElement).getBoundingClientRect().top
    )
    expect(top).toBeGreaterThanOrEqual(40)
    expect(top).toBeLessThanOrEqual(90)
  })
})

// Published target episode. It used to be a reviewed buffer page, so this locks
// the promotion contract: the page stays built/reachable, becomes indexable,
// enters the public manifest/sidebar/sitemap, and keeps the synced transcript.
// Fully file-based (no browser, no remote audio); requires a prior build.
test.describe('published target episode (francais-003)', () => {
  const SLUG = '003-le-covoiturage-poli'
  const SRC = path.resolve(`src/podcast/francais/${SLUG}.md`)
  const CUES = path.resolve(`src/podcast/francais/${SLUG}.cues.json`)
  const HTML = path.resolve(`.vitepress/dist/podcast/francais/${SLUG}.html`)
  const SITEMAP = path.resolve('.vitepress/dist/sitemap.xml')
  const V6_MP3 = 'francais-003-le-covoiturage-poli-v6.mp3'

  test('builds a reachable page with the synced transcript and v6 audio', () => {
    expect(fs.existsSync(HTML)).toBeTruthy()
    const html = fs.readFileSync(HTML, 'utf-8')
    expect(html).toContain('class="vox-transcript"')
    expect((html.match(/class="vox-cue/g) || []).length).toBeGreaterThan(50)
    expect(html).toContain(V6_MP3)
    expect(fs.readFileSync(SRC, 'utf-8')).toContain(`import cues from './${SLUG}.cues.json'`)
  })

  test('cue JSON uses the v6 public audio', () => {
    const cues = JSON.parse(fs.readFileSync(CUES, 'utf-8'))
    expect(cues.episode.audioUrl).toContain(V6_MP3)
  })

  test('is public and indexable after release promotion', () => {
    expect(fs.readFileSync(HTML, 'utf-8')).not.toContain('name="robots" content="noindex')
    const fm = fs.readFileSync(SRC, 'utf-8').match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? ''
    expect(fm).not.toMatch(/^buffer:\s*true$/m)
    expect(fm).not.toMatch(/^search:\s*false$/m)
  })

  test('is included in the sitemap with 001 and 002', () => {
    const sitemap = fs.readFileSync(SITEMAP, 'utf-8')
    expect(sitemap).toContain('001-le-badge')
    expect(sitemap).toContain('002-la-valise-verte')
    expect(sitemap).toContain(SLUG)
  })

  test('is listed in the public manifest and sidebar', () => {
    const manifest = JSON.parse(fs.readFileSync('src/podcast/francais/episodes.json', 'utf-8'))
    expect(manifest.map((e: { number: number }) => e.number)).toContain(3)
    expect(manifest.find((e: { number: number }) => e.number === 3)?.href).toContain(SLUG)
    expect(fs.readFileSync('.vitepress/config.ts', 'utf-8')).toContain(`/podcast/francais/${SLUG}`)
  })
})

// Per-show episode card grid: a generated manifest drives SSR cards on the index
// pages. Released episodes are listed; future buffers/drafts remain absent.
// File-based; requires a prior build (pnpm podcast:build).
test.describe('episode card grid', () => {
  const MANIFEST = path.resolve('src/podcast/francais/episodes.json')
  const INDEX_HTML = path.resolve('.vitepress/dist/podcast/francais/index.html')
  const RELEASED_SLUG = '003-le-covoiturage-poli'
  const FUTURE_BUFFER_SLUG = '004-le-studio-calme'

  test('manifest includes released public episodes and excludes future buffers', () => {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'))
    const numbers = manifest.map((e: { number: number }) => e.number)
    expect(numbers).toContain(1)
    expect(numbers).toContain(2)
    expect(numbers).toContain(3)
    expect(numbers).not.toContain(4)
    for (const e of manifest) {
      expect(typeof e.title).toBe('string')
      expect(e.href).toMatch(/^\/podcast\/francais\//)
      expect(typeof e.durationSeconds).toBe('number')
    }
  })

  test('built index renders SSR episode cards with numbers', () => {
    const html = fs.readFileSync(INDEX_HTML, 'utf-8')
    expect(html).toContain('class="card-grid"')
    expect((html.match(/class="card-grid__item"/g) || []).length).toBe(3)
    // the episode number is preserved as the card eyebrow (001/002/003 style)
    expect(html).toMatch(/card-grid__eyebrow[^>]*>001</)
    expect(html).toMatch(/card-grid__eyebrow[^>]*>002</)
    expect(html).toMatch(/card-grid__eyebrow[^>]*>003</)
  })

  test('cards link to public episode pages and show duration', () => {
    const html = fs.readFileSync(INDEX_HTML, 'utf-8')
    expect(html).toContain('href="/podcast/francais/001-le-badge"')
    expect(html).toContain('href="/podcast/francais/002-la-valise-verte"')
    expect(html).toContain(`href="/podcast/francais/${RELEASED_SLUG}"`)
    expect(html).toMatch(/\d+ min/)
  })

  test('future buffer episode is not linked from the index', () => {
    const html = fs.readFileSync(INDEX_HTML, 'utf-8')
    // Future buffer slugs may appear in VitePress's internal route hashmap, but
    // must never be a navigable link or appear in the card grid.
    expect(html).not.toContain(`href="/podcast/francais/${FUTURE_BUFFER_SLUG}"`)
    const grid = html.match(/<ul class="card-grid".*?<\/ul>/s)?.[0] ?? ''
    expect(grid).not.toContain(FUTURE_BUFFER_SLUG)
  })
})

// The pre-publication notice renders (theme content-top slot) only on buffer
// pages (frontmatter buffer: true). Public pages must stay clean. File-based;
// requires a prior build.
test.describe('buffer notice', () => {
  const dist = (slug: string) => path.resolve(`.vitepress/dist/podcast/francais/${slug}.html`)
  const FR_LABEL = 'Pré-publication · page non listée'

  test('does not render on public episode pages (001, 002, 003)', () => {
    for (const slug of ['001-le-badge', '002-la-valise-verte', '003-le-covoiturage-poli']) {
      const html = fs.readFileSync(dist(slug), 'utf-8')
      expect(html).not.toContain('class="buffer-notice"')
      expect(html).not.toContain(FR_LABEL)
    }
  })
})

// Generated show manifest drives an SSR CardGrid on the /podcast/ hub. Episode
// counts come from the per-show episodes.json, so released episodes count and
// future buffers do not. File-based; needs a prior build (pnpm podcast:build).
test.describe('podcast hub show grid', () => {
  const SHOWS = path.resolve('src/podcast/shows.json')
  const HUB_HTML = path.resolve('.vitepress/dist/podcast/index.html')

  test('shows manifest has the three shows with public episode counts', () => {
    const shows = JSON.parse(fs.readFileSync(SHOWS, 'utf-8'))
    expect(shows).toHaveLength(3)
    for (const s of shows) {
      expect(typeof s.title).toBe('string')
      expect(s.href).toMatch(/^\/podcast\/[a-z]+\/$/)
      expect(typeof s.imageUrl).toBe('string')
      expect(typeof s.description).toBe('string')
      expect(typeof s.meta).toBe('string')
      expect(typeof s.episodeCount).toBe('number')
    }
    // francais includes the released 003 and excludes future buffers.
    const fr = shows.find((s: { href: string }) => s.href === '/podcast/francais/')
    expect(fr.episodeCount).toBe(3)
  })

  test('built hub renders three SSR show cards linking to the series', () => {
    const html = fs.readFileSync(HUB_HTML, 'utf-8')
    expect(html).toContain('class="card-grid"')
    expect((html.match(/class="card-grid__item"/g) || []).length).toBe(3)
    for (const lang of ['francais', 'espanol', 'english']) {
      expect(html).toContain(`href="/podcast/${lang}/"`)
    }
    expect(html).toMatch(/\d+ (épisodes?|episodios?|episodes?)/)
  })

  test('does not leak future buffer episodes into the hub', () => {
    const html = fs.readFileSync(HUB_HTML, 'utf-8')
    // Future buffer slugs may appear in VitePress's internal route hashmap, but
    // never as a link or inside the card grid.
    expect(html).not.toContain('href="/podcast/francais/004-le-studio-calme"')
    const grid = html.match(/<ul class="card-grid".*?<\/ul>/s)?.[0] ?? ''
    expect(grid).not.toContain('004-le-studio-calme')
  })
})

test.describe('podcast sidebar labels', () => {
  const CONFIG = path.resolve('.vitepress/config.ts')

  test('uses one podcast sidebar with show groups and public episodes', () => {
    const config = fs.readFileSync(CONFIG, 'utf-8')
    const podcastSidebar =
      config.match(/'\/podcast\/': \[[\s\S]*?\n  \],\n\n  '\/literatura\/':/)?.[0] ?? ''
    expect(config.match(/^\s*'\/podcast\/':/gm)).toHaveLength(1)
    expect(config).not.toMatch(/^\s*'\/podcast\/(?:francais|espanol|english)\/':/m)

    expect(podcastSidebar).toMatch(
      /text: 'Vox Français',\s*link: '\/podcast\/francais\/'[\s\S]*?001 - Le badge[\s\S]*?002 - La valise verte[\s\S]*?003 - Le covoiturage poli/
    )
    expect(podcastSidebar).toMatch(
      /text: 'Vox Español',\s*link: '\/podcast\/espanol\/'[\s\S]*?001 - La boda es a las seis[\s\S]*?002 - La sartén está ocupada/
    )
    expect(podcastSidebar).toMatch(
      /text: 'Vox English',\s*link: '\/podcast\/english\/'[\s\S]*?001 - The Two-Minute Phone Call[\s\S]*?002 - The Bowl of Something/
    )
    expect(podcastSidebar).not.toMatch(
      /text: '(Podcasts|Présentation|Presentación|Overview|Visão geral)'/
    )
    expect(podcastSidebar).not.toMatch(/text: '(Autres podcasts|Otros podcasts|Other podcasts)'/)
    expect(config).not.toContain('Vox Español - Podcast de español como lengua extranjera')
  })
})

// Product contract for the compact "lesson thesis" episode header
// (PodcastEpisodeHeader), generated by sync-podcast-lesson-pages.py. These lock
// in the redesign so the old generated-document shape cannot creep back.
test.describe('podcast episode header', () => {
  const PUBLIC_003_HTML = path.resolve(
    '.vitepress/dist/podcast/francais/003-le-covoiturage-poli.html'
  )

  test('built page SSR-renders the compact header (eyebrow, episode-title H1, lede)', () => {
    const html = fs.readFileSync(DIST_HTML, 'utf-8')
    expect(html).toContain('class="vox-ep__eyebrow"')
    expect(html).toContain('Vox Français') // show, from cue JSON
    expect(html).toMatch(/Épisode[^<]*001/) // localized label + number from id
    expect(html).toMatch(/\d+ min/) // duration from durationSeconds
    expect(html).toContain('class="vox-ep__lede"')
    expect(html).toContain('Se présenter, préciser un rôle') // learning point (slot text)
  })

  test('visible H1 is the episode title only; SEO/frontmatter title stays full', () => {
    const html = fs.readFileSync(DIST_HTML, 'utf-8')
    const h1s = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gs)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim()
    )
    expect(h1s).toEqual(['Le badge']) // exactly one H1, episode title only
    const title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    expect(title).toContain('Vox Français 001 — Le badge') // full SEO <title>
    expect(html).toContain('property="og:title" content="Vox Français 001 — Le badge"')
  })

  test('drops the generated-document boilerplate (intro, permalink, Transcript H2)', () => {
    const html = fs.readFileSync(DIST_HTML, 'utf-8')
    expect(html).not.toContain('Cette page accompagne') // no boilerplate intro
    expect(html).not.toContain('Lien permanent') // no raw permalink block
    expect(html).not.toContain('Transcription complète') // no transcript H2
  })

  test('keeps the native player + transcript, with no custom player controls', () => {
    const html = fs.readFileSync(DIST_HTML, 'utf-8')
    expect(html).toContain('vox-player') // native audio player
    expect(html).toContain('class="vox-transcript"') // SSR transcript
    // the rejected custom controls must not return
    expect(html).not.toContain('vox-step')
    expect(html).not.toContain('vox-rate')
  })

  test('LLM output expands the header to plain Markdown (no component tag)', () => {
    const llms = fs.readFileSync(LLMS_FILE, 'utf-8')
    expect(llms).not.toContain('<PodcastEpisodeHeader')
    expect(llms).toContain('# Le badge')
    expect(llms).toContain('Série: Vox Français')
    expect(llms).toContain('Épisode: 001')
    expect(llms).toContain('Point principal: Se présenter, préciser un rôle')
  })

  test('published 003 page has the header with no BufferNotice', () => {
    const html = fs.readFileSync(PUBLIC_003_HTML, 'utf-8')
    const header = html.indexOf('vox-ep__eyebrow')
    expect(header).toBeGreaterThanOrEqual(0)
    expect(html).not.toContain('class="buffer-notice"')
  })

  test('the page generator is idempotent', () => {
    const out = execFileSync('python3', ['scripts/sync-podcast-lesson-pages.py'], {
      encoding: 'utf-8'
    }).trim()
    expect(out).toBe('No podcast lesson page changes.')
  })
})
