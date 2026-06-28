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

export interface FeaturedWork {
  title: string
  meta: string
}
