import type { CardGridItem } from './cards'

// One entry of a generated src/podcast/<show>/episodes.json manifest.
interface Episode {
  number: number
  title: string
  href: string
  durationSeconds: number | null
  description: string
  artworkUrl: string
}

// Adapt the podcast episodes manifest to generic CardGrid items: the episode
// number becomes a zero-padded eyebrow, the cover an image, and the duration a
// "N min" meta line. Keeps episodes.json unchanged and keeps podcast specifics
// out of the shared CardGrid component.
export function episodesToCards(episodes: Episode[]): CardGridItem[] {
  return episodes.map((episode) => ({
    eyebrow: String(episode.number).padStart(3, '0'),
    title: episode.title,
    href: episode.href,
    description: episode.description,
    imageUrl: episode.artworkUrl,
    imageAlt: '',
    meta:
      episode.durationSeconds && episode.durationSeconds > 0
        ? `${Math.round(episode.durationSeconds / 60)} min`
        : undefined
  }))
}
