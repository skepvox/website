<script setup lang="ts">
/**
 * SkLink — owned interaction-state link primitive.
 *
 * A TRANSPARENT anchor wrapper: it renders exactly one SSR `<a>` root (no extra element,
 * no changed nesting, no component artifact) and passes class / target / rel / aria-label
 * / title through via $attrs, so consuming markup and rendered DOM stay byte-equivalent.
 *
 * It owns only the SURFACE-INDEPENDENT half of the navigation four-state standard
 * (docs/navigation-owned-shell-assessment.md), so every owned affordance shares one
 * source of truth instead of re-declaring it:
 *   - KEYBOARD FOCUS: a single --sk-focus-ring on :focus-visible.
 *   - PRESSED / TOUCH: neutral — pressing produces no sticky visual state, and the grey
 *     tap-highlight flash is suppressed. No colour is imposed on press, so a consumer's
 *     resting colour is never changed.
 *   - CURRENT ROUTE: aria-current="page" only when `current` is true.
 *
 * It deliberately does NOT own the VISIBLE pointer-hover styling: each consumer keeps its
 * own hover rule, gated under `@media (hover: hover) and (pointer: fine)`, so hover never
 * applies on touch (the tap-after-back class of bug).
 *
 * Fast-follow migration candidates: CardGrid card links and the Home pillars.
 */
defineOptions({ inheritAttrs: false })
defineProps<{ href: string; current?: boolean }>()
</script>

<template>
  <a :href="href" :aria-current="current ? 'page' : undefined" v-bind="$attrs"><slot /></a>
</template>

<style scoped>
a {
  /* Neutral touch: suppress the default grey tap-highlight so a press leaves no sticky
     visual state. Visible pointer-hover belongs to the consumer, pointer-gated. */
  -webkit-tap-highlight-color: transparent;
}

a:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
  border-radius: var(--sk-radius-sm);
}
</style>
