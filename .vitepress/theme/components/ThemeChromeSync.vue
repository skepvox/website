<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()

const SURFACE = { light: '#f6f1e6', dark: '#181510' } as const

let observer: MutationObserver | null = null
let stopRoute: (() => void) | null = null
let lastDark: boolean | null = null
let tick = 0

function apply(dark: boolean): void {
  if (typeof document === 'undefined') return
  const surface = dark ? SURFACE.dark : SURFACE.light

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', surface)

  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'

  document.documentElement.style.backgroundColor = 'var(--sk-surface)'
  document.body.style.backgroundColor = 'var(--sk-surface)'
  const app = document.getElementById('app')
  if (app) app.style.backgroundColor = 'var(--sk-surface)'

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
  observer = new MutationObserver(syncOnToggle)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

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
