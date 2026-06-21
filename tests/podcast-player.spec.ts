import { test, expect } from '@playwright/test'
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

// Real unlisted buffer episode. Asserts the stable buffer-visibility contract:
// built + reachable, noindex, our search:false/buffer directives, sitemap
// exclusion, and no listing/sidebar link. Deliberately avoids VitePress-internal
// search-index chunks (hashed name + version-dependent format). Fully file-based
// (no browser, no remote audio); requires a prior build (pnpm podcast:build).
test.describe('buffer episode (francais-003)', () => {
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

  test('is noindex and flagged search:false / buffer', () => {
    expect(fs.readFileSync(HTML, 'utf-8')).toContain('name="robots" content="noindex, nofollow"')
    const fm = fs.readFileSync(SRC, 'utf-8').match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? ''
    expect(fm.match(/^buffer: true$/gm)?.length).toBe(1)
    expect(fm.match(/^search: false$/gm)?.length).toBe(1)
  })

  test('is excluded from the sitemap while 001 and 002 remain', () => {
    const sitemap = fs.readFileSync(SITEMAP, 'utf-8')
    expect(sitemap).not.toContain(SLUG)
    expect(sitemap).toContain('001-le-badge')
    expect(sitemap).toContain('002-la-valise-verte')
  })

  test('is not linked from listings or the sidebar', () => {
    for (const rel of [
      'src/podcast/francais/index.md',
      'src/podcast/index.md',
      '.vitepress/config.ts'
    ]) {
      expect(fs.readFileSync(path.resolve(rel), 'utf-8')).not.toContain(SLUG)
    }
  })
})

// Per-show episode card grid: a generated manifest drives SSR cards on the index
// pages. Buffer/draft episodes are excluded from the manifest and never linked.
// File-based; requires a prior build (pnpm podcast:build).
test.describe('episode card grid', () => {
  const MANIFEST = path.resolve('src/podcast/francais/episodes.json')
  const INDEX_HTML = path.resolve('.vitepress/dist/podcast/francais/index.html')
  const BUFFER_SLUG = '003-le-covoiturage-poli'

  test('manifest includes public episodes and excludes the buffer', () => {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'))
    const numbers = manifest.map((e: { number: number }) => e.number)
    expect(numbers).toContain(1)
    expect(numbers).toContain(2)
    expect(numbers).not.toContain(3) // francais-003 is a buffer
    for (const e of manifest) {
      expect(typeof e.title).toBe('string')
      expect(e.href).toMatch(/^\/podcast\/francais\//)
      expect(typeof e.durationSeconds).toBe('number')
    }
  })

  test('built index renders SSR episode cards with numbers', () => {
    const html = fs.readFileSync(INDEX_HTML, 'utf-8')
    expect(html).toContain('class="card-grid"')
    expect((html.match(/class="card-grid__item"/g) || []).length).toBe(2)
    // the episode number is preserved as the card eyebrow (001/002 style)
    expect(html).toMatch(/card-grid__eyebrow[^>]*>001</)
    expect(html).toMatch(/card-grid__eyebrow[^>]*>002</)
  })

  test('cards link to public episode pages and show duration', () => {
    const html = fs.readFileSync(INDEX_HTML, 'utf-8')
    expect(html).toContain('href="/podcast/francais/001-le-badge"')
    expect(html).toContain('href="/podcast/francais/002-la-valise-verte"')
    expect(html).toMatch(/\d+ min/)
  })

  test('no buffer episode is linked from the index', () => {
    const html = fs.readFileSync(INDEX_HTML, 'utf-8')
    // The buffer slug may appear in VitePress's internal route hashmap, but it
    // must never be a navigable link or appear in the card grid.
    expect(html).not.toContain(`href="/podcast/francais/${BUFFER_SLUG}"`)
    const grid = html.match(/<ul class="card-grid".*?<\/ul>/s)?.[0] ?? ''
    expect(grid).not.toContain(BUFFER_SLUG)
  })
})

// The pre-publication notice renders (theme content-top slot) only on buffer
// pages (frontmatter buffer: true). Public pages must stay clean. File-based;
// requires a prior build. (noindex/search:false/sitemap/reachability for 003 are
// covered by the 'buffer episode (francais-003)' block above.)
test.describe('buffer notice', () => {
  const dist = (slug: string) => path.resolve(`.vitepress/dist/podcast/francais/${slug}.html`)
  const FR_LABEL = 'Pré-publication · page non listée'

  test('renders on the francais-003 buffer page', () => {
    const html = fs.readFileSync(dist('003-le-covoiturage-poli'), 'utf-8')
    expect(html).toContain('class="buffer-notice"')
    expect(html).toContain(FR_LABEL)
  })

  test('does not render on public episode pages (001, 002)', () => {
    for (const slug of ['001-le-badge', '002-la-valise-verte']) {
      const html = fs.readFileSync(dist(slug), 'utf-8')
      expect(html).not.toContain('class="buffer-notice"')
      expect(html).not.toContain(FR_LABEL)
    }
  })
})

// Generated show manifest drives an SSR CardGrid on the /podcast/ hub. Episode
// counts come from the per-show episodes.json (buffers already excluded), so the
// buffer episode never reaches the public count or the grid. File-based; needs a
// prior build (pnpm podcast:build).
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
    // francais excludes the buffer episode (003) from the public count
    const fr = shows.find((s: { href: string }) => s.href === '/podcast/francais/')
    expect(fr.episodeCount).toBe(2)
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

  test('does not leak the buffer episode into the hub', () => {
    const html = fs.readFileSync(HUB_HTML, 'utf-8')
    // The buffer slug may appear in VitePress's internal route hashmap, but never
    // as a link or inside the card grid.
    expect(html).not.toContain('href="/podcast/francais/003-le-covoiturage-poli"')
    const grid = html.match(/<ul class="card-grid".*?<\/ul>/s)?.[0] ?? ''
    expect(grid).not.toContain('003-le-covoiturage-poli')
  })
})
