<script setup lang="ts">
import { computed } from 'vue'
import { READER_ICON_PATHS, type ReaderIconName } from './reader-icons'

// The owned reader-shell icon wrapper (Slice C1) — the single durable boundary the reader shell
// imports. It renders one inline SVG from the closed registry (reader-icons.ts) with the owned
// size/stroke/optical/a11y defaults, so size/stroke/colour/motion never drift per call site.
//   - Decorative by default (aria-hidden); pass `label` only for a future icon-only control.
//   - Colour is currentColor (inherits the control's ink → flips light/dark for free); NO color prop.
//   - Stroke is the --sk-icon-stroke token (NOT a prop); rendered non-scaling so it is a constant
//     visual hairline (1.5px) at any glyph size.
//   - It animates nothing and owns no focus ring (those live on the control: SkLink / the button).
// No stroke / color / rotate / svg-class props — by design (anti-drift; see assessment §5).
const props = withDefaults(
  defineProps<{ name: ReaderIconName; label?: string; size?: 'chrome' | 'touch' }>(),
  { size: 'chrome' }
)

const path = computed(() => READER_ICON_PATHS[props.name])
const decorative = computed(() => !props.label)
</script>

<template>
  <svg
    class="reader-icon"
    :class="`reader-icon--${size}`"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    focusable="false"
    :aria-hidden="decorative ? 'true' : undefined"
    :role="decorative ? undefined : 'img'"
  >
    <title v-if="!decorative">{{ label }}</title>
    <path :d="path" vector-effect="non-scaling-stroke" />
  </svg>
</template>

<style scoped>
/* The owned reader glyph: cap-aligned to the adjacent label, a constant 1.5px visual hairline
   (non-scaling-stroke), round terminals. No animation, no focus ring, no colour of its own. */
.reader-icon {
  display: inline-block;
  flex: 0 0 auto;
  vertical-align: -0.125em;
  shape-rendering: geometricPrecision;
  stroke-width: var(--sk-icon-stroke);
}
.reader-icon--chrome {
  width: var(--sk-icon-size);
  height: var(--sk-icon-size);
}
.reader-icon--touch {
  width: var(--sk-icon-touch);
  height: var(--sk-icon-touch);
}
</style>
