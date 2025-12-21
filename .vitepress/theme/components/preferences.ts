import { ref } from 'vue'
import { AugmentedHeader } from '../../headerMdPlugin'

export const inBrowser = typeof window !== 'undefined'
const get = (key: string, defaultValue = false): boolean =>
  inBrowser
    ? JSON.parse(localStorage.getItem(key) || String(defaultValue))
    : defaultValue

export const preferCompositionKey = 'skepvox-prefer-edition'
export const preferComposition = ref(get(preferCompositionKey, false))

export const preferSFCKey = 'vue-docs-prefer-sfc'
export const preferSFC = ref(get(preferSFCKey, true))

export function filterHeadersByPreference(h: AugmentedHeader) {
  return preferComposition.value ? !h.optionsOnly : !h.compositionOnly
}
