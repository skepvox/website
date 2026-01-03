<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { EnemQuestion } from '../../enem/types'
import { loadQuestionFromPublic } from '../../enem/data'
import type { LoadQuestion } from '../../enem/data'
import QuestionCard from './QuestionCard.vue'

const props = withDefaults(
  defineProps<{
    questionId: string
    loadQuestion?: LoadQuestion
    baseUrl?: string
    showPlaceholders?: boolean
    showArea?: boolean
  }>(),
  {
    baseUrl: '',
    showPlaceholders: false,
    showArea: true
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
</script>

<template>
  <div
    v-if="isLoading"
    class="enem-question-card enem-question-card--state"
    aria-live="polite"
  >
    Carregando quest&atilde;o...
  </div>
  <div
    v-else-if="errorMessage"
    class="enem-question-card enem-question-card--state enem-question-card--error"
    aria-live="polite"
  >
    {{ errorMessage }}
  </div>
  <div v-else-if="!question" class="enem-question-card enem-question-card--state">
    Nenhuma quest&atilde;o encontrada.
  </div>
  <QuestionCard
    v-else
    :question="question"
    :show-placeholders="props.showPlaceholders"
    :show-area="props.showArea"
  />
</template>
