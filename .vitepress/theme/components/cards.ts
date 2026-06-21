// Shared item shape for the generic SSR CardGrid. A card links to `href`, with an
// optional square image, an optional brand-colored eyebrow (e.g. an episode
// number) shown before the title, a clamped description, and an optional meta line.
export interface CardGridItem {
  title: string
  href: string
  description?: string
  imageUrl?: string
  imageAlt?: string
  meta?: string
  eyebrow?: string
}
