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
