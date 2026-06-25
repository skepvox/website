import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// footer:false pager hygiene (docs/sidebar-local-nav-model.md, Slice 1).
// The rented @vue/theme VPContentDocFooter derives prev/next from the sidebar and
// ignores frontmatter, so it mis-paginated CROSS-show on podcast episodes (Vox Français
// 003 -> Vox Español 001) and CROSS-author on literature work hubs. footer:false is now
// set on every non-leaf route, so that pager must render nowhere on these routes.
// File-based against the built site (same approach as podcast-show-page.spec / reading-nav.spec).
const DIST = path.resolve('.vitepress/dist')

// cleanUrls: hubs build to <route>/index.html; work-hub + episode pages build to <route>.html.
function html(route: string): string {
  const leaf = path.join(DIST, `${route}.html`)
  const dir = path.join(DIST, route, 'index.html')
  const file = fs.existsSync(leaf) ? leaf : dir
  return fs.readFileSync(file, 'utf-8')
}

// Representative routes across the three corpora where the sidebar-derived pager was wrong.
const ROUTES = [
  'podcast', // podcast hub
  'podcast/francais/003-le-covoiturage-poli', // last Vox Français episode — used to page into Vox Español 001
  'podcast/espanol/001-la-boda-es-a-las-seis', // first Vox Español episode — used to be paged into from fr/003
  'literatura', // literatura section hub
  'literatura/machado-de-assis', // author hub
  'literatura/machado-de-assis/bras-cubas', // work hub — used to page cross-author
  'literatura/raul-pompeia/o-ateneu', // work hub (outline: [2, 3])
  'louis-lavelle', // Lavelle hub
  'louis-lavelle/de-l-etre', // Lavelle work hub
  'louis-lavelle/introducao-a-ontologia' // pipeline pt work hub — used to page into "De l'être"
]

test.describe('doc pager retired on non-leaf routes (footer:false)', () => {
  for (const route of ROUTES) {
    test(`${route}: no sidebar-derived VPContentDocFooter pager`, () => {
      expect(html(route)).not.toContain('VPContentDocFooter')
    })
  }

  test('the cross-show pager is gone: Vox Français 003 has no link into Vox Español', () => {
    const page = html('podcast/francais/003-le-covoiturage-poli')
    expect(page).not.toContain('VPContentDocFooter')
    // the wrong "Próximo" used to be a pager link to the first Spanish episode
    expect(page).not.toMatch(/class="[^"]*next-link[^"]*"[\s\S]*?\/podcast\/espanol\//)
  })

  test('reading leaves remain unaffected (still no pager, ReadingNav present)', () => {
    const leaf = html('literatura/graciliano-ramos/vidas-secas/00-00-001-mudanca')
    expect(leaf).not.toContain('VPContentDocFooter')
    expect(leaf).toContain('reading-nav--bottom') // owned chapter nav still there
  })
})
