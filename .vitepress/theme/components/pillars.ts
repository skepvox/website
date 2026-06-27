// Single source of truth for the three visible primary pillars — the first-level site IA shared by the
// global nav (.vitepress/config.ts) and the homepage (Home.vue), so the two can never drift. PURE DATA:
// no Vue import, no JSON import, no pipeline-export import — so config.ts can import it at config-eval
// time without pulling a component or book-data graph into the build config.
//
// This module owns ONLY the route/label/IA layer. Live content previews (book titles, segment counts,
// latest episode) are deliberately NOT here — they are sourced separately in a later slice (H3/H4) via
// the pipeline-export card helpers and the podcast manifests; this keeps the pillar IA free of any data
// dependency.
//
// The visible third pillar is Vox Français — the focused public podcast identity — linking straight to
// /podcast/francais/. Vox Español and Vox English stay public, indexed and reachable by direct URL, the
// /podcast/ hub, the podcast sidebar and the sitemap; they are simply not promoted in the primary
// homepage/nav path. The broader /podcast/ hub is intentionally not a primary pillar.

export interface Pillar {
  /** stable key for iteration / test hooks; never shown to the reader. */
  key: string
  /** visible nav + homepage label. */
  label: string
  /** canonical section destination (trailing slash, locale-rooted where applicable). */
  href: string
  /** VitePress nav `activeMatch` regex, in string form. */
  activeMatch: string
  /** calm one-line homepage blurb. */
  blurb: string
}

export const PILLARS: Pillar[] = [
  {
    key: 'literatura',
    label: 'Literatura',
    href: '/pt/literatura/',
    activeMatch: '^/pt/literatura/',
    blurb: 'Clássicos que mantenho por perto, em uma biblioteca pessoal que venho construindo.'
  },
  {
    key: 'filosofia',
    label: 'Filosofia',
    href: '/pt/filosofia/',
    activeMatch: '^/pt/filosofia/',
    blurb: 'Textos de filosofia, alguns ainda pouco acessíveis, que venho organizando aos poucos.'
  },
  {
    key: 'vox-francais',
    label: 'Vox Français',
    href: '/podcast/francais/',
    activeMatch: '^/podcast/francais/',
    blurb:
      'Podcast criado para meu próprio estudo, como uma forma de manter contato com a língua e aprimorar meu francês.'
  }
]
