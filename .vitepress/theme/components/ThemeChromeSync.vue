<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

// Keep the browser/OS chrome (mobile Safari top bar, safe-area + overscroll regions)
// in sync with the owned surface the instant the theme toggles — otherwise iOS keeps
// the previous theme-color until the nav closes and the page scrolls, which reads as
// broken. Renders nothing; side-effect only. The refined CSS theme transition
// (utilities.css) is untouched.

// Owned page surface — must match --sk-surface in vars.css (light + dark).
const SURFACE = { light: '#fcfcfa', dark: '#181510' } as const

let observer: MutationObserver | null = null
let lastDark: boolean | null = null
let tick = 0

function syncChrome(): void {
  if (typeof document === 'undefined') return
  const dark = document.documentElement.classList.contains('dark')
  if (dark === lastDark) return
  lastDark = dark
  const surface = dark ? SURFACE.dark : SURFACE.light

  // 1. theme-color meta drives the mobile browser bar + safe-area tint.
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', surface)

  // 2. color-scheme themes native UI (scrollbars, overscroll, form controls).
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'

  // 3. Tie the root surfaces to the owned token so the overscroll / safe-area gaps
  //    show the page background, not a stale or transparent fill.
  document.documentElement.style.backgroundColor = 'var(--sk-surface)'
  document.body.style.backgroundColor = 'var(--sk-surface)'
  const app = document.getElementById('app')
  if (app) app.style.backgroundColor = 'var(--sk-surface)'

  // 4. iOS can defer repainting the bar until the next paint. Nudge one harmless,
  //    layout-free repaint via a custom-property tick (no scroll, no reflow).
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--sk-chrome-tick', String(++tick))
  })
}

onMounted(() => {
  syncChrome()
  // Observe the .dark class toggle on <html> directly — robust regardless of which
  // system (VitePress / @vue/theme) flips it, and fires even while the nav is open.
  observer = new MutationObserver(syncChrome)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <span aria-hidden="true" hidden></span>
</template>
