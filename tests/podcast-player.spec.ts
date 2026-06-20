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
