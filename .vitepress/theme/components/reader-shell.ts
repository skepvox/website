// Shared reader-shell labels + route helpers for the live pipeline reader (work hub, leaf location
// header, leaf prev/next nav). ONE source of truth for the per-language label vocabulary and for href
// construction from a segment's routePath, so the hub (PipelineWorkContents), the F1 location path
// (PipelineReaderHeader), and the bottom nav (PipelineSegmentNav) cannot drift — and the future fr
// edition (and the next book) inherit them with no per-component change.
//
// - Labels are stored SENTENCE-CASE; any uppercase look is applied in CSS (so accents / screen
//   readers / copy-paste stay correct). pt is the live edition; fr/en are provisional — the fr edition
//   slice confirms the final fr strings. Resolution falls back to pt, mirroring the existing components.
// - routePath is PRESENTATION only (public href construction), never identity — identity stays
//   canonicalId / segmentPrefix.

const PT = 'pt'
const pick = (map: Record<string, string>, lang: string | undefined): string =>
  map[lang ?? PT] ?? map[PT]

export const NAV_LABEL: Record<string, string> = { pt: 'Sumário', fr: 'Sommaire', en: 'Contents' }
export const OPENING_LABEL: Record<string, string> = {
  pt: 'Abertura',
  fr: 'Ouverture',
  en: 'Opening'
}
export const LOC_LABEL: Record<string, string> = {
  pt: 'Localização',
  fr: 'Emplacement',
  en: 'Location'
}
export const SEGNAV_LABEL: Record<string, string> = {
  pt: 'Navegação de trechos',
  fr: 'Navigation des extraits',
  en: 'Segment navigation'
}
export const PREV_LABEL: Record<string, string> = {
  pt: 'Anterior',
  fr: 'Précédent',
  en: 'Previous'
}
export const NEXT_LABEL: Record<string, string> = {
  pt: 'Próximo',
  fr: 'Suivant',
  en: 'Next'
}
export const navLabel = (lang?: string) => pick(NAV_LABEL, lang) // contents: Sumário / Sommaire / Contents
export const openingLabel = (lang?: string) => pick(OPENING_LABEL, lang) // front-matter group: Abertura …
export const locLabel = (lang?: string) => pick(LOC_LABEL, lang) // location-path nav aria-label
export const segNavLabel = (lang?: string) => pick(SEGNAV_LABEL, lang) // bottom-nav aria-label
export const prevLabel = (lang?: string) => pick(PREV_LABEL, lang) // prev direction label
export const nextLabel = (lang?: string) => pick(NEXT_LABEL, lang) // next direction label
// Author line under the hub title. The edition/language is already implied by the section and route;
// keep the masthead humble and avoid repeating "edição em português" on every work hub.
export const editionLine = (author: string, _lang?: string): string => author

// ---- Route helpers — derived from a segment record's routePath (PRESENTATION, not identity) ----

// Segment public href: a leading slash on the routePath.
export const segmentHref = (routePath: string) => `/${routePath}`

// Work-hub href: drop the leaf from the routePath, keep the trailing slash. Work-/edition-agnostic, e.g.
//   'pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008' → '/pt/filosofia/louis-lavelle/introducao-a-ontologia/'
//   'louis-lavelle/introduction-a-l-ontologie/00-00-000-001-avertissement' → '/louis-lavelle/introduction-a-l-ontologie/'
export const workHubHref = (routePath: string) => `/${routePath.split('/').slice(0, -1).join('/')}/`

// Hub return href: opens + highlights the chapter containing this segment (#trecho-<segmentPrefix>).
export const trechoHref = (routePath: string, segmentPrefix: string) =>
  `${workHubHref(routePath)}#trecho-${segmentPrefix}`
