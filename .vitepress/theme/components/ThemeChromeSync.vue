<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useData } from 'vitepress'

// Keep the browser/OS chrome (mobile Safari top bar, safe-area + overscroll regions) in
// sync with the owned surface. Renders nothing; side-effect only. The CSS theme
// transition (utilities.css) fades the visible page as one composition; this component
// only makes the (non-animatable) Safari chrome jump promptly to the correct FINAL
// colour, so the page fades toward a bar that is already right.

const { page } = useData()

// Owned page surface — must match --sk-surface in vars.css (light + dark).
const SURFACE = { light: '#fcfcfa', dark: '#181510' } as const

let observer: MutationObserver | null = null
let stopRoute: (() => void) | null = null
let lastDark: boolean | null = null
let tick = 0

function apply(dark: boolean): void {
  if (typeof document === 'undefined') return
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

  // 3. Tie the root surfaces to the owned token so overscroll / safe-area gaps show the
  //    page background. These follow the CSS fade above (same token), they do not jump.
  document.documentElement.style.backgroundColor = 'var(--sk-surface)'
  document.body.style.backgroundColor = 'var(--sk-surface)'
  const app = document.getElementById('app')
  if (app) app.style.backgroundColor = 'var(--sk-surface)'

  // 4. iOS can defer repainting the bar; nudge one harmless, layout-free repaint.
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--sk-chrome-tick', String(++tick))
  })
}

function syncOnToggle(): void {
  const dark = document.documentElement.classList.contains('dark')
  if (dark === lastDark) return
  lastDark = dark
  apply(dark)
}

onMounted(() => {
  syncOnToggle()
  // React to theme toggles regardless of which system flips the .dark class, even while
  // the nav is open.
  observer = new MutationObserver(syncOnToggle)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  // Re-assert after client-side navigation: VitePress re-applies the per-route <head>,
  // and iOS can drop the theme-color bar repaint across a route change. Re-setting the
  // owned values (idempotent — same colour, no flash) + a repaint tick keeps the upper
  // chrome synced after nav/back without waiting for a scroll.
  stopRoute = watch(
    () => page.value.relativePath,
    () => apply(document.documentElement.classList.contains('dark'))
  )
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  stopRoute?.()
  stopRoute = null
})
</script>

<template>
  <span aria-hidden="true" hidden></span>
</template>
