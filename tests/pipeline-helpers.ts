// Shared fixtures for the pipeline-export reader-shell specs. The work-id magic strings and the
// (workId, language) filter live in ONE place here — the multi-work invariant (B2/B3) is that LANGUAGE
// ALONE never identifies a reading sequence, so every reader-shell assertion scopes by (workId, language).
// Import LAVELLE_WORK_ID / BRAS_WORK_ID + workSegments instead of inlining the strings + filter.

export const LAVELLE_WORK_ID = 'louis-lavelle/introduction-a-l-ontologie'
export const BRAS_WORK_ID = 'machado-de-assis/bras-cubas'

// Filter a segment list to one work (and optionally one language), sorted by reading order. Pass any
// segment-like rows (the pipeline-export-segments.json `segments`), since the specs use `any`.
export function workSegments(segments: any[], workId: string, language?: string): any[] {
  return segments
    .filter((s) => s.workId === workId && (language === undefined || s.language === language))
    .slice()
    .sort((a, b) => a.order - b.order)
}
