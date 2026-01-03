<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import katex from 'katex'
import type { EnemQuestion } from '../../enem/types'
import QuestionAssets from './QuestionAssets.vue'
import AssetChart from './assets/AssetChart.vue'

const props = withDefaults(
  defineProps<{
    question: EnemQuestion
    showPlaceholders?: boolean
    showArea?: boolean
  }>(),
  {
    showPlaceholders: false,
    showArea: true
  }
)

const isAnnulled = computed(
  () => props.question.metadata?.annulled || props.question.correct_answer === null
)
const correctAnswer = computed(() => props.question.correct_answer ?? null)
const selectedOption = ref<string | null>(null)
const isAnswerRevealed = computed(() => selectedOption.value !== null)
const isOptionsLocked = computed(
  () => isAnnulled.value || !correctAnswer.value || selectedOption.value !== null
)

const isOptionSelected = (letter: string) => selectedOption.value === letter
const isOptionCorrect = (letter: string) => letter === correctAnswer.value

const handleOptionSelect = (letter: string) => {
  if (isOptionsLocked.value) {
    return
  }
  selectedOption.value = letter
}

const areaLabel = computed(() => props.question.area?.name || props.question.area?.code)
const showArea = computed(() => props.showArea && Boolean(areaLabel.value))
const subjectLabel = computed(() => props.question.subject?.name || '')
const competencyLabel = computed(() => props.question.competency || '')
const skillLabel = computed(() => props.question.skill || '')

const contextType = computed(() => props.question.context?.type || 'text')
const hasContext = computed(() => Boolean(props.question.context?.content))
const contextContent = computed(() => props.question.context?.content || '')
const isListContext = computed(() => contextType.value === 'list')
const isPoemContext = computed(() => contextType.value === 'poem')
const isLyricsContext = computed(() => contextType.value === 'lyrics')
const isPlainTextContext = computed(
  () => !isListContext.value && !isPoemContext.value && !isLyricsContext.value
)

const statementText = computed(() => props.question.statement || '')
const promptText = computed(() => props.question.prompt?.text || '')
const hasPrompt = computed(() => Boolean(promptText.value.trim()))
const isPromptOnly = computed(() => {
  const prompt = promptText.value.trim()
  const statement = statementText.value.trim()
  return Boolean(prompt) && prompt === statement
})
const showStatement = computed(() => {
  const statement = statementText.value.trim()
  if (!statement) {
    return false
  }
  return !isPromptOnly.value
})

const renderOptionLatex = (value?: string) => {
  if (!value) {
    return null
  }
  try {
    return katex.renderToString(value, {
      displayMode: false,
      throwOnError: true
    })
  } catch {
    return null
  }
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const renderBlockLatex = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  try {
    return katex.renderToString(trimmed, {
      displayMode: true,
      throwOnError: true
    })
  } catch {
    const escaped = escapeHtml(trimmed)
    return `<span class="enem-question-card__inline-em enem-question-card__inline-em--block">${escaped}</span>`
  }
}

const renderInlineHtml = (text: string) => {
  if (!text) {
    return ''
  }
  const regex = /\\\(/g
  let cursor = 0
  let result = ''
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const start = match.index
    const endToken = '\\)'
    const endIndex = text.indexOf(endToken, regex.lastIndex)
    if (endIndex === -1) {
      break
    }
    result += escapeHtml(text.slice(cursor, start))
    const inner = escapeHtml(text.slice(regex.lastIndex, endIndex))
    result += `<span class="enem-question-card__inline-em">${inner}</span>`
    cursor = endIndex + endToken.length
    regex.lastIndex = cursor
  }

  result += escapeHtml(text.slice(cursor))
  return result
}

const resolveOptionImageUrl = (file?: string) => {
  if (!file) {
    return ''
  }
  if (file.startsWith('http://') || file.startsWith('https://')) {
    return file
  }
  if (file.startsWith('/')) {
    return withBase(file)
  }
  return withBase(`/enem/${props.question.year}/${file}`)
}

const getOptionLabel = (letter: string, text?: string, alt?: string) => {
  const label = (text || '').trim() || (alt || '').trim()
  return label || `Alternativa ${letter}`
}

type ListSegment =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }

type PlainTextSegment =
  | { type: 'paragraph'; text: string }
  | { type: 'katex-block'; latex: string }

const splitPlainSegments = (raw: string): PlainTextSegment[] => {
  if (!raw) {
    return []
  }
  const segments: PlainTextSegment[] = []
  const parts = raw.split(/\\\[(.+?)\\\]/gs)

  const pushParagraphs = (value: string) => {
    const paragraphs = value
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
      .filter(Boolean)
    for (const paragraph of paragraphs) {
      segments.push({ type: 'paragraph', text: paragraph })
    }
  }

  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      const latex = part.trim()
      if (latex) {
        segments.push({ type: 'katex-block', latex })
      }
      return
    }
    pushParagraphs(part)
  })

  if (!segments.length) {
    const fallback = raw.replace(/\s*\n\s*/g, ' ').trim()
    if (fallback) {
      segments.push({ type: 'paragraph', text: fallback })
    }
  }

  return segments
}

const parseListSegments = (raw: string): ListSegment[] => {
  if (!raw) {
    return []
  }
  const lines = raw.split('\n')
  const segments: ListSegment[] = []
  let paragraphLines: string[] = []
  let listItems: string[] | null = null

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return
    }
    segments.push({ type: 'paragraph', text: paragraphLines.join(' ') })
    paragraphLines = []
  }

  const flushList = () => {
    if (!listItems?.length) {
      listItems = null
      return
    }
    segments.push({ type: 'list', items: listItems })
    listItems = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      flushList()
      continue
    }
    const bulletMatch = rawLine.match(/^\s*\u2022\s*(.*)$/)
    if (bulletMatch) {
      flushParagraph()
      if (!listItems) {
        listItems = []
      }
      listItems.push(bulletMatch[1].trim())
      continue
    }
    if (listItems) {
      flushList()
    }
    paragraphLines.push(line)
  }

  flushParagraph()
  flushList()

  return segments
}

const contextSegments = computed<ListSegment[]>(() => {
  if (!isListContext.value) {
    return []
  }
  return parseListSegments(contextContent.value)
})

const contextPlainSegments = computed<PlainTextSegment[]>(() => {
  if (!isPlainTextContext.value) {
    return []
  }
  return splitPlainSegments(contextContent.value)
})

const statementSegments = computed<PlainTextSegment[]>(() =>
  splitPlainSegments(statementText.value)
)

const statementHasList = computed(() =>
  /(^|\n)\s*\u2022\s+/.test(statementText.value)
)
const statementListSegments = computed<ListSegment[]>(() => {
  if (!statementHasList.value) {
    return []
  }
  return parseListSegments(statementText.value)
})

const contextSource = computed(() => {
  const source = props.question.context?.source
  if (!source) {
    return ''
  }
  const parts = [
    source.author,
    source.title,
    source.publisher,
    source.location,
    source.year ? String(source.year) : null,
    source.note
  ].filter(Boolean)
  return parts.join(' - ')
})

watch(
  () => props.question.id,
  () => {
    selectedOption.value = null
  }
)
</script>

<template>
  <article class="enem-question-card" :data-question-id="question.id">
    <header class="enem-question-card__header">
      <div class="enem-question-card__meta">
        <span class="enem-question-card__number">Quest&atilde;o {{ question.number }}</span>
        <span v-if="showArea" class="enem-question-card__area">{{ areaLabel }}</span>
      </div>
      <div class="enem-question-card__tags">
        <span v-if="subjectLabel" class="enem-question-card__tag">{{ subjectLabel }}</span>
        <span v-if="competencyLabel" class="enem-question-card__tag">
          Comp. {{ competencyLabel }}
        </span>
        <span v-if="skillLabel" class="enem-question-card__tag">
          Hab. {{ skillLabel }}
        </span>
        <span v-if="isAnnulled" class="enem-question-card__badge">Anulada</span>
      </div>
    </header>

    <div class="enem-question-card__body">
      <section
        v-if="hasContext"
        class="enem-question-card__context"
        :data-context-type="contextType"
      >
        <template v-if="isListContext">
          <template v-for="(segment, index) in contextSegments" :key="`segment-${index}`">
            <p
              v-if="segment.type === 'paragraph'"
              class="enem-question-card__context-text"
              v-html="renderInlineHtml(segment.text)"
            />
            <ul v-else class="enem-question-card__context-list">
              <li
                v-for="(item, itemIndex) in segment.items"
                :key="`item-${itemIndex}`"
                class="enem-question-card__context-list-item"
                v-html="renderInlineHtml(item)"
              />
            </ul>
          </template>
        </template>
        <template v-else-if="isPlainTextContext">
          <template v-for="(segment, index) in contextPlainSegments" :key="`segment-${index}`">
            <p
              v-if="segment.type === 'paragraph'"
              class="enem-question-card__context-text"
              v-html="renderInlineHtml(segment.text)"
            />
            <div
              v-else
              class="enem-question-card__context-formula"
              v-html="renderBlockLatex(segment.latex)"
            />
          </template>
        </template>
        <p v-else class="enem-question-card__context-text">
          {{ contextContent }}
        </p>
        <p v-if="contextSource" class="enem-question-card__context-source">
          {{ contextSource }}
        </p>
      </section>

      <QuestionAssets
        :assets="question.assets"
        :year="question.year"
        :question-number="question.number"
        position="context"
        :show-placeholders="props.showPlaceholders"
      />

      <section v-if="showStatement" class="enem-question-card__statement">
        <template v-if="statementHasList">
          <template v-for="(segment, index) in statementListSegments" :key="`statement-${index}`">
            <p
              v-if="segment.type === 'paragraph'"
              class="enem-question-card__statement-text"
              v-html="renderInlineHtml(segment.text)"
            />
            <ul v-else class="enem-question-card__context-list">
              <li
                v-for="(item, itemIndex) in segment.items"
                :key="`statement-item-${itemIndex}`"
                class="enem-question-card__context-list-item"
                v-html="renderInlineHtml(item)"
              />
            </ul>
          </template>
        </template>
        <template v-else>
          <template v-for="(segment, index) in statementSegments" :key="`statement-${index}`">
            <p
              v-if="segment.type === 'paragraph'"
              class="enem-question-card__statement-text"
              v-html="renderInlineHtml(segment.text)"
            />
            <div
              v-else
              class="enem-question-card__statement-formula"
              v-html="renderBlockLatex(segment.latex)"
            />
          </template>
        </template>
      </section>

      <QuestionAssets
        :assets="question.assets"
        :year="question.year"
        :question-number="question.number"
        position="statement"
        :show-placeholders="props.showPlaceholders"
      />

      <section v-if="hasPrompt" class="enem-question-card__statement enem-question-card__prompt">
        <p
          class="enem-question-card__statement-text enem-question-card__prompt-text"
          v-html="renderInlineHtml(promptText)"
        />
      </section>

      <section class="enem-question-card__options" aria-label="Alternativas">
        <ul class="enem-question-card__options-list">
          <li
            v-for="option in question.options"
            :key="option.letter"
            class="enem-question-card__option"
            :class="{
              'enem-question-card__option--correct': isAnswerRevealed && isOptionCorrect(option.letter),
              'enem-question-card__option--wrong':
                isAnswerRevealed && isOptionSelected(option.letter) && !isOptionCorrect(option.letter)
            }"
          >
            <button
              type="button"
              class="enem-question-card__option-button"
              :aria-label="`Selecionar alternativa ${option.letter}`"
              :aria-pressed="isOptionSelected(option.letter)"
              :aria-disabled="isOptionsLocked"
              :disabled="isOptionsLocked"
              @click="handleOptionSelect(option.letter)"
            >
              {{ option.letter }}
            </button>
            <button
              type="button"
              class="enem-question-card__option-box"
              :aria-label="getOptionLabel(option.letter, option.text, option.image_alt)"
              :aria-pressed="isOptionSelected(option.letter)"
              :aria-disabled="isOptionsLocked"
              :disabled="isOptionsLocked"
              @click="handleOptionSelect(option.letter)"
            >
              <AssetChart
                v-if="option.chart"
                :asset="option.chart"
                :year="question.year"
                :question-number="question.number"
                variant="option"
              />
              <img
                v-else-if="option.image"
                class="enem-question-card__option-image"
                :src="resolveOptionImageUrl(option.image)"
                :alt="option.image_alt || ''"
                loading="lazy"
              />
              <span
                v-else-if="!option.latex"
                class="enem-question-card__option-text"
              >
                {{ option.text }}
              </span>
              <span
                v-else
                class="enem-question-card__option-text enem-question-card__option-text--latex"
                v-html="renderOptionLatex(option.latex) || option.text"
              />
            </button>
          </li>
        </ul>
      </section>

      <QuestionAssets
        :assets="question.assets"
        :year="question.year"
        :question-number="question.number"
        position="options"
        :show-placeholders="props.showPlaceholders"
      />
    </div>
  </article>
</template>
