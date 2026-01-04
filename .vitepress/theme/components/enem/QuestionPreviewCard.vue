<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import type { EnemQuestion } from '../../enem/types'
import { loadQuestionFromPublic, parseQuestionId } from '../../enem/data'
import type { LoadQuestion } from '../../enem/data'

const props = withDefaults(
  defineProps<{
    questionId: string
    loadQuestion?: LoadQuestion
    baseUrl?: string
  }>(),
  {
    baseUrl: ''
  }
)

const question = ref<EnemQuestion | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

const fetchQuestion = async () => {
  if (!props.questionId) {
    question.value = null
    errorMessage.value = 'Missing question id.'
    return
  }
  isLoading.value = true
  errorMessage.value = null
  try {
    const loader =
      props.loadQuestion ||
      ((id: string) => loadQuestionFromPublic(id, props.baseUrl || undefined))
    question.value = await loader(props.questionId)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
    question.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void fetchQuestion()
  watch(
    () => props.questionId,
    () => {
      void fetchQuestion()
    }
  )
})

const statementText = computed(() => (question.value?.statement || '').trim())
const promptText = computed(() => (question.value?.prompt?.text || '').trim())

const getLastParagraph = (value: string) => {
  if (!value) {
    return ''
  }
  const paragraphs = value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  if (!paragraphs.length) {
    return ''
  }
  return paragraphs[paragraphs.length - 1]
}

const enunciadoText = computed(() => {
  const statement = statementText.value
  const prompt = promptText.value
  if (prompt && prompt !== statement) {
    return getLastParagraph(prompt)
  }
  return getLastParagraph(statement)
})

const hasEnunciado = computed(() => Boolean(enunciadoText.value))

const questionNumber = computed(() => {
  if (question.value?.number) {
    return question.value.number
  }
  const parts = parseQuestionId(props.questionId)
  return parts?.questionNumber ?? null
})

const questionLabel = computed(() =>
  questionNumber.value ? `Questão ${questionNumber.value}` : 'Questão'
)

const questionUrl = computed(() => {
  if (!question.value) {
    return ''
  }
  const parts = parseQuestionId(question.value.id || props.questionId)
  if (!parts) {
    return ''
  }
  const areaCode = question.value.area?.code || 'matematica'
  return withBase(`/enem/${parts.year}/${areaCode}/questao/${parts.questionSlug}`)
})

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

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
    result += `<span class="enem-question-preview__inline-em">${inner}</span>`
    cursor = endIndex + endToken.length
    regex.lastIndex = cursor
  }

  result += escapeHtml(text.slice(cursor))
  return result
}
</script>

<template>
  <div
    v-if="isLoading"
    class="enem-question-preview enem-question-preview--state"
    aria-live="polite"
  >
    Carregando enunciado...
  </div>
  <div
    v-else-if="errorMessage"
    class="enem-question-preview enem-question-preview--state enem-question-preview--error"
    aria-live="polite"
  >
    {{ errorMessage }}
  </div>
  <div v-else-if="!question" class="enem-question-preview enem-question-preview--state">
    Nenhuma questão encontrada.
  </div>
  <a
    v-else
    :href="questionUrl"
    class="enem-question-preview"
    :data-question-id="question.id"
    :aria-label="`Abrir ${questionLabel}`"
  >
    <div class="enem-question-preview__header">
      <span class="enem-question-preview__number">{{ questionLabel }}</span>
    </div>
    <div class="enem-question-preview__body">
      <p
        v-if="hasEnunciado"
        class="enem-question-preview__text"
        v-html="renderInlineHtml(enunciadoText)"
      />
      <p
        v-else
        class="enem-question-preview__text enem-question-preview__text--empty"
      >
        Enunciado em construção.
      </p>
    </div>
  </a>
</template>
