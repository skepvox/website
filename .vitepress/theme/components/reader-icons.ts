// Owned reader-shell icon registry (Slice C1). The reader shell imports ReaderIcon only; ReaderIcon
// reads this map. No @vue/theme VTIcon*, no lucide runtime dependency — the path data is VENDORED
// from lucide's ISC-licensed chevron geometry (24×24 grid) and committed as our own, so the symbol
// language is owned and immune to upstream churn. The set is CLOSED: adding a glyph is a reviewed,
// type-checked edit to this union (governance, see docs/reader-icon-symbol-system-assessment.md §4/§6).
// Deferred/forbidden glyphs (contents/list, languages/globe, zoom-out, progress, AI, annotation) are
// intentionally absent until their surfaces exist.

export type ReaderIconName = 'chevron-left' | 'chevron-right' | 'chevron-up' | 'disclosure'

// 24×24 viewBox path data (lucide chevron geometry, round caps/joins applied by ReaderIcon).
// `disclosure` is the right-pointing chevron AT REST; the consumer rotates it 90° → down on open.
export const READER_ICON_PATHS: Record<ReaderIconName, string> = {
  'chevron-left': 'm15 18-6-6 6-6',
  'chevron-right': 'm9 18 6-6-6-6',
  'chevron-up': 'm18 15-6-6-6 6',
  disclosure: 'm9 18 6-6-6-6'
}
