import { defineConfig, devices } from '@playwright/test'

// Regression tests for the synced-transcript PodcastPlayer. They run against the
// BUILT site served by `vitepress preview`, so build first:
//   pnpm build            (or pnpm podcast:build)
//   pnpm test
const PORT = 4399
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry'
  },
  webServer: {
    command: `pnpm exec vitepress preview --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 }
      }
    },
    {
      // Pixel 5 is a Chromium-based mobile device (narrow viewport + touch),
      // so the suite needs only the already-cached Chromium browser.
      name: 'mobile',
      use: { ...devices['Pixel 5'] }
    }
  ]
})
