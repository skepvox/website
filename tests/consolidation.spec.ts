import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Card-component consolidation guard: EpisodeGrid and AuthorGrid were merged into
// the generic CardGrid and removed. Ensure they are not reintroduced or imported.
// Scans source only (src + .vitepress/theme); build output (dist/cache) excluded.
const SOURCE_EXT = /\.(md|ts|vue|js|mjs)$/
const SKIP_DIRS = new Set(['node_modules', 'dist', 'cache', '.git'])

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) sourceFiles(path.join(dir, entry.name), acc)
    } else if (SOURCE_EXT.test(entry.name)) {
      acc.push(path.join(dir, entry.name))
    }
  }
  return acc
}

test.describe('card component consolidation', () => {
  test('the removed card components no longer exist', () => {
    for (const file of ['EpisodeGrid.vue', 'AuthorGrid.vue']) {
      expect(fs.existsSync(path.resolve('.vitepress/theme/components', file))).toBe(false)
    }
  })

  test('no source file in src or .vitepress/theme references the removed components', () => {
    const files = [
      ...sourceFiles(path.resolve('src')),
      ...sourceFiles(path.resolve('.vitepress/theme'))
    ]
    const offenders = files.filter((f) =>
      /EpisodeGrid|AuthorGrid/.test(fs.readFileSync(f, 'utf-8'))
    )
    expect(offenders).toEqual([])
  })
})
