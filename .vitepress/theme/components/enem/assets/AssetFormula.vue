<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'
import type {
  EnemQuestionFormulaAsset,
  EnemQuestionFormulaSegment
} from '../../../enem/types'

const props = defineProps<{
  asset: EnemQuestionFormulaAsset
}>()

type FormulaSegment =
  | { kind: 'text'; value: string }
  | {
      kind: 'katex'
      html: string
      display: 'inline' | 'block'
      raw: string
      padLeft: boolean
      padRight: boolean
    }

const normalizeLatex = (value: string) => value.trim()

const renderLatex = (value: string, display: 'inline' | 'block') => {
  const latex = normalizeLatex(value)
  if (!latex) {
    return null
  }
  try {
    return katex.renderToString(latex, {
      displayMode: display === 'block',
      throwOnError: true
    })
  } catch {
    return null
  }
}

const buildSegments = (segments: EnemQuestionFormulaSegment[]) => {
  const output: FormulaSegment[] = []
  for (const segment of segments) {
    if (segment.type === 'text') {
      if (segment.value) {
        output.push({ kind: 'text', value: segment.value })
      }
      continue
    }
    const display = segment.display === 'block' ? 'block' : 'inline'
    const html = renderLatex(segment.value, display)
    if (html) {
      output.push({
        kind: 'katex',
        html,
        display,
        raw: segment.value,
        padLeft: false,
        padRight: false
      })
    } else if (segment.value) {
      output.push({ kind: 'text', value: segment.value })
    }
  }
  return output
}

const addAutoSpacing = (segments: FormulaSegment[]) => {
  const needsLeftPad = (text: string) => {
    if (!text) {
      return false
    }
    if (/\s$/.test(text)) {
      return false
    }
    if (/[([{]$/.test(text)) {
      return false
    }
    return true
  }

  const needsRightPad = (text: string) => {
    if (!text) {
      return false
    }
    if (/^\s/.test(text)) {
      return false
    }
    if (/^[,.;:!?)}\]]/.test(text)) {
      return false
    }
    return true
  }

  segments.forEach((segment, index) => {
    if (segment.kind !== 'katex' || segment.display !== 'inline') {
      return
    }
    const prev = segments[index - 1]
    const next = segments[index + 1]
    if (prev?.kind === 'text') {
      segment.padLeft = needsLeftPad(prev.value)
    }
    if (next?.kind === 'text') {
      segment.padRight = needsRightPad(next.value)
    }
  })
  return segments
}

const formulaSegments = computed<FormulaSegment[]>(() => {
  const asset = props.asset
  let output: FormulaSegment[] = []
  if (asset.segments && asset.segments.length > 0) {
    output = buildSegments(asset.segments)
  } else {
    if (asset.text) {
      output.push({ kind: 'text', value: asset.text })
    }
    if (asset.latex) {
      const html = renderLatex(asset.latex, 'inline')
      if (html) {
        output.push({
          kind: 'katex',
          html,
          display: 'inline',
          raw: asset.latex,
          padLeft: false,
          padRight: false
        })
      } else {
        output.push({ kind: 'text', value: asset.latex })
      }
    }
  }
  return addAutoSpacing(output)
})

const hasSegments = computed(() => formulaSegments.value.length > 0)
</script>

<template>
  <div class="enem-question-card__asset enem-question-card__asset--formula">
    <div v-if="hasSegments" class="enem-question-card__formula">
      <p class="enem-question-card__formula-content">
        <template v-for="(segment, index) in formulaSegments" :key="index">
          <span v-if="segment.kind === 'text'" class="enem-question-card__formula-text">
            {{ segment.value }}
          </span>
          <span
            v-else-if="segment.display === 'inline'"
            class="enem-question-card__formula-math enem-question-card__formula-chip"
            :class="{
              'enem-question-card__formula-chip--pad-left': segment.padLeft,
              'enem-question-card__formula-chip--pad-right': segment.padRight
            }"
            v-html="segment.html"
          />
          <span
            v-else
            class="enem-question-card__formula-math enem-question-card__formula-block"
            v-html="segment.html"
          />
        </template>
      </p>
    </div>
    <code v-else class="enem-question-card__formula-fallback">
      {{ props.asset.latex || props.asset.text }}
    </code>
  </div>
</template>
