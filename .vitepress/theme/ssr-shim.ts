if (typeof window === 'undefined') {
  // Ensure SSR doesn't treat Node's empty localStorage shim as real storage.
  try {
    delete (globalThis as { localStorage?: unknown }).localStorage
  } catch {
    ;(globalThis as { localStorage?: unknown }).localStorage = undefined
  }
}
