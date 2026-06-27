// Shared item shape for the generic SSR CardGrid. A card links to `href`, with an
// optional square image, an optional brand-colored eyebrow (e.g. an episode
// number) shown before the title, a clamped description, and an optional meta line.
// imageVariant is a small presentation hint for images with sitewide visual rules
// (currently author portraits); generic card behavior remains unchanged.
export interface CardGridItem {
  title: string
  href: string
  description?: string
  imageUrl?: string
  imageAlt?: string
  imageVariant?: 'portrait'
  meta?: string
  eyebrow?: string
}

// The single featured work a section surfaces as a quiet homepage pillar preview (slice H3): the work
// `title` plus a short, pre-composed `meta` line (e.g. "163 capítulos" / "99 trechos"). Built by the
// per-section card helpers from the SAME pipeline-export metadata the hubs read, so the homepage never
// imports that JSON itself. Deliberately title-only — no author, no route — so the calm index never
// reintroduces author framing (e.g. "Louis Lavelle") or a deep link.
export interface FeaturedWork {
  title: string
  meta: string
}
