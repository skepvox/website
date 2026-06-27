import type { FeaturedWork } from './cards'
import francaisEpisodes from '../../../src/podcast/francais/episodes.json'

// The homepage promotes Vox Francais as a personal study surface, but it should still show one quiet
// proof-of-life line. Use the first episode rather than the latest so the public entry point remains
// stable and humble: "001 · Le badge".
export function voxFrancaisFeaturedEpisode(): FeaturedWork | null {
  const first = francaisEpisodes.find((episode) => episode.number === 1) ?? francaisEpisodes[0]
  if (!first) return null
  return {
    title: first.title,
    meta: String(first.number).padStart(3, '0')
  }
}
