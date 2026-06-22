<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import sidebarNav from '../data/sidebar-nav.json'
import SkLink from './SkLink.vue'

// Owned within-show episode pager, rendered in the content-bottom slot on podcast EPISODE
// leaves only — never on show pages, the podcast hub, book leaves, or home. It restores the
// correct "next lesson" progression after Slice 1 removed the wrong sidebar-derived doc
// pager, and unlike that pager it never crosses a show/corpus boundary (Vox Français 003
// never links to Vox Español 001). Data is the generated, PUBLIC-only sidebar-nav.json
// (Slice 2A), so buffer/private episodes never leak.
const { page } = useData()

interface Episode {
  number: number
  title: string
  href: string
}

// Localized direction labels + nav-landmark name, by show key; English is the fallback.
const STRINGS: Record<string, { prev: string; next: string; nav: string }> = {
  francais: { prev: 'Précédent', next: 'Suivant', nav: 'Navigation des épisodes' },
  espanol: { prev: 'Anterior', next: 'Siguiente', nav: 'Navegación de episodios' },
  english: { prev: 'Previous', next: 'Next', nav: 'Episode navigation' }
}

// podcast/<show>/<NNN>-<slug>.md — an episode leaf (excludes index.md show/hub pages).
const EPISODE_RE = /^podcast\/([^/]+)\/(\d{3}-[^/]+)\.md$/

// Show + strictly-within-show prev/next, derived from the page's source path and the public
// episode manifest. Returns null on any non-episode page, so the component renders nothing.
const nav = computed(() => {
  const match = (page.value.relativePath || '').match(EPISODE_RE)
  if (!match) return null
  const [, showKey, slug] = match
  const href = `/podcast/${showKey}/${slug}`
  const podcast = sidebarNav.corpora.find((corpus) => corpus.key === 'podcast') as
    | { shows: { href: string; episodes: Episode[] }[] }
    | undefined
  const show = podcast?.shows.find((entry) => entry.href === `/podcast/${showKey}/`)
  if (!show) return null
  const episodes = show.episodes
  const index = episodes.findIndex((episode) => episode.href === href)
  if (index < 0) return null // not in the public manifest (e.g. an unlisted buffer page)
  return {
    strings: STRINGS[showKey] ?? STRINGS.english,
    prev: index > 0 ? episodes[index - 1] : null,
    next: index < episodes.length - 1 ? episodes[index + 1] : null
  }
})

const hasNav = computed(() => !!nav.value && (!!nav.value.prev || !!nav.value.next))
</script>

<template>
  <nav v-if="hasNav && nav" class="episode-nav" :aria-label="nav.strings.nav">
    <div class="episode-nav__row">
      <SkLink
        v-if="nav.prev"
        class="episode-nav__link episode-nav__link--prev"
        :href="nav.prev.href"
        rel="prev"
      >
        <span class="episode-nav__dir">‹ {{ nav.strings.prev }}</span>
        <span class="episode-nav__title">{{ nav.prev.title }}</span>
      </SkLink>
      <span v-else class="episode-nav__spacer" aria-hidden="true"></span>
      <SkLink
        v-if="nav.next"
        class="episode-nav__link episode-nav__link--next"
        :href="nav.next.href"
        rel="next"
      >
        <span class="episode-nav__dir">{{ nav.strings.next }} ›</span>
        <span class="episode-nav__title">{{ nav.next.title }}</span>
      </SkLink>
      <span v-else class="episode-nav__spacer" aria-hidden="true"></span>
    </div>
  </nav>
</template>

<style scoped>
/* The only episode-to-episode navigation: a quiet prev/next "continue listening" footer
   after the transcript + guide, within one show. Same restraint as ReadingNav, but it spans
   the episode content column (wider than the 35rem reading measure) rather than the narrow
   reading column — no card, no sticky controls, no progress bar. */
.episode-nav {
  margin: 2.75rem 0 0;
  padding-top: 1.25rem;
  border-top: 1px solid var(--sk-reading-rule);
}

.episode-nav__row {
  display: flex;
  justify-content: space-between;
  gap: var(--sk-space-5);
}

.episode-nav__link {
  display: flex;
  min-width: 0;
  max-width: 48%;
  flex-direction: column;
  gap: 0.15rem;
  text-decoration: none;
}

.episode-nav__link--next {
  margin-left: auto;
  text-align: right;
}

.episode-nav__spacer {
  flex: 0 1 48%;
}

.episode-nav__dir {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
}

.episode-nav__title {
  overflow: hidden;
  font-size: 0.95rem;
  line-height: 1.4;
  color: var(--sk-reading-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.18s ease;
}

/* Four-state floor (navigation interaction-state standard): the visible hover lift applies
   only on real pointer devices, so an iOS tap never sticks the hover state. Keyboard focus +
   neutral pressed/touch are owned by the SkLink primitive (see components/SkLink.vue). */
@media (hover: hover) and (pointer: fine) {
  .episode-nav__link:hover .episode-nav__title {
    color: var(--sk-reading-heading);
  }
}
</style>
