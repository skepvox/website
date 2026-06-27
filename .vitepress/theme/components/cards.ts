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

// The single featured item a homepage pillar surfaces as a quiet proof-of-life line: a compact
// `meta` marker (original publication year, catalogue number) plus the `title`. Built by small helper
// modules so the homepage never imports pipeline-export or podcast manifests directly. Deliberately
// title-only for books — no author, no route — so the calm index never reintroduces author framing
// (e.g. "Louis Lavelle") or a deep link.
export interface FeaturedWork {
  title: string
  meta: string
}
