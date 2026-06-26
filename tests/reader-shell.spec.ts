import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import {
  navLabel,
  openingLabel,
  locLabel,
  segNavLabel,
  prevLabel,
  nextLabel,
  editionLine,
  segmentHref,
  workHubHref,
  trechoHref
} from '../.vitepress/theme/components/reader-shell'

// Slice F2 — the shared reader-shell label + route-helper module: ONE source of truth for the
// per-language vocabulary + href construction from routePath. Proves pt behavior is unchanged and that
// the helpers produce correct fr output — WITHOUT shipping any fr page/route.
const PT_ROUTE = 'pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008'
const FR_ROUTE = 'louis-lavelle/introduction-a-l-ontologie/00-00-000-001-avertissement'
const READER_SHELL = path.resolve('.vitepress/theme/components/reader-shell.ts')
const compSrc = (f: string) =>
  fs.readFileSync(path.resolve('.vitepress/theme/components', f), 'utf-8')

test.describe('reader-shell shared labels + route helpers (Slice F2)', () => {
  test('pt labels are exactly the live strings (behavior unchanged); prev/next are the new short labels', () => {
    expect(navLabel('pt')).toBe('Sumário')
    expect(openingLabel('pt')).toBe('Abertura')
    expect(locLabel('pt')).toBe('Localização')
    expect(segNavLabel('pt')).toBe('Navegação de trechos')
    expect(prevLabel('pt')).toBe('Anterior') // Slice F2: "trecho" dropped
    expect(nextLabel('pt')).toBe('Próximo')
    expect(prevLabel('pt')).not.toBe('Trecho anterior')
    expect(nextLabel('pt')).not.toBe('Próximo trecho')
    expect(editionLine('Louis Lavelle', 'pt')).toBe('Louis Lavelle — edição em português')
  })

  test('label resolution falls back to pt for unknown/undefined languages', () => {
    expect(navLabel(undefined)).toBe('Sumário')
    expect(navLabel('xx')).toBe('Sumário')
    expect(openingLabel('zz')).toBe('Abertura')
  })

  test('fr-readiness: the helpers produce fr labels + fr hrefs from a synthetic fr record', () => {
    expect(navLabel('fr')).toBe('Sommaire')
    expect(openingLabel('fr')).toBe('Ouverture')
    expect(locLabel('fr')).toBe('Emplacement')
    // fr hub href derived from the fr routePath (drop the leaf) — NOT a pt hard-code
    expect(workHubHref(FR_ROUTE)).toBe('/louis-lavelle/introduction-a-l-ontologie/')
    // fr #trecho href from the fr routePath + segmentPrefix
    expect(trechoHref(FR_ROUTE, '00-00-000-001')).toBe(
      '/louis-lavelle/introduction-a-l-ontologie/#trecho-00-00-000-001'
    )
  })

  test('route helpers: pt hrefs equal the previous hard-coded HUB exactly (no behavior change)', () => {
    expect(segmentHref(PT_ROUTE)).toBe('/' + PT_ROUTE)
    expect(workHubHref(PT_ROUTE)).toBe('/pt/filosofia/louis-lavelle/introducao-a-ontologia/')
    expect(trechoHref(PT_ROUTE, '00-01-002-008')).toBe(
      '/pt/filosofia/louis-lavelle/introducao-a-ontologia/#trecho-00-01-002-008'
    )
  })

  test('routePath is presentation only — pure helpers, no data/identity coupling', () => {
    const src = fs.readFileSync(READER_SHELL, 'utf-8')
    expect(/import[^\n]*\.json/.test(src)).toBe(false) // no data import — operates on passed strings
    expect(/from ['"]vue['"]/.test(src)).toBe(false) // pure helpers, not a Vue component
    expect(src.includes('segmentPrefix')).toBe(true) // only used to build the #trecho hash
  })

  test('source discipline: the reader components no longer hard-code HUB or duplicate label maps', () => {
    for (const f of [
      'PipelineReaderHeader.vue',
      'PipelineSegmentNav.vue',
      'PipelineWorkContents.vue'
    ]) {
      const src = compSrc(f)
      expect(/const HUB\s*=/.test(src)).toBe(false) // no local hub hard-code
      expect(src.includes("'/pt/filosofia/louis-lavelle/introducao-a-ontologia/'")).toBe(false) // no pt hub literal
      expect(/(NAV|OPENING|LOC|EDITION)_(LABEL|WORD)\s*:/.test(src)).toBe(false) // no local label maps
      expect(src.includes("from './reader-shell'")).toBe(true) // reads from the shared module
    }
  })
})
