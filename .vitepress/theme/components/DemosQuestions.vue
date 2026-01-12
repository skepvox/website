<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type NoteRef = {
  id: string | null
  type: string | null
  url: string
  title: string | null
}

type QuestionContainer = {
  id: string
  type: string
  url: string
  title: string | null
}

type QuestionEntry = {
  id: string
  state: string | null
  question: string | null
  hypothesis: string | null
  counterHypothesis: string | null
  nextSteps: string | null
  container: QuestionContainer
  advancingNotes: NoteRef[]
  targetedBy: NoteRef[]
}

type QuestionsIssues = {
  missingBacklinks: Array<{
    questionId: string
    questionIn: string
    targetNoteId: string
  }>
  inconsistentStates: Array<{
    questionId: string
    questionIn: string
    state: string
    targetedByCount: number
    advancingNotesCount: number
  }>
  orphanQuestions: Array<{
    questionId: string
    questionIn: string
  }>
  missingTargetQuestions: Array<{
    questionId: string
    targetNoteId: string
  }>
}

type QuestionsData = {
  schema: string
  schemaVersion: number
  source?: { sha256: string }
  questionCount: number
  countsByState: Record<string, number>
  questions: QuestionEntry[]
  issues: QuestionsIssues
}

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<QuestionsData | null>(null)

const query = ref('')
const stateFilter = ref<string>('all')
const onlyOrphans = ref(false)
const onlyIssues = ref(false)

function normalizeForSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function queryTokens(value: string) {
  const normalized = normalizeForSearch(value)
  if (!normalized) return []
  return normalized.split(/\s+/).filter(Boolean)
}

function isOrphan(q: QuestionEntry) {
  return (q.targetedBy?.length ?? 0) === 0 && (q.advancingNotes?.length ?? 0) === 0
}

const allQuestions = computed(() => data.value?.questions ?? [])

const issueQuestionIds = computed(() => {
  const ids = new Set<string>()
  for (const item of data.value?.issues?.missingBacklinks ?? []) ids.add(item.questionId)
  for (const item of data.value?.issues?.inconsistentStates ?? []) ids.add(item.questionId)
  for (const item of data.value?.issues?.missingTargetQuestions ?? []) ids.add(item.questionId)
  return ids
})

const filteredQuestions = computed(() => {
  const tokens = queryTokens(query.value)
  const state = stateFilter.value

  const matchesQuery = (q: QuestionEntry) => {
    if (tokens.length === 0) return true
    const haystack = normalizeForSearch(
      [
        q.id,
        q.state ?? '',
        q.question ?? '',
        q.container?.id ?? '',
        q.container?.title ?? '',
        q.container?.url ?? '',
        ...(q.targetedBy ?? []).flatMap((n) => [n.id ?? '', n.title ?? '', n.url ?? '']),
        ...(q.advancingNotes ?? []).flatMap((n) => [n.id ?? '', n.title ?? '', n.url ?? ''])
      ].join(' ')
    )
    return tokens.every((t) => haystack.includes(t))
  }

  const matchesState = (q: QuestionEntry) => {
    if (state === 'all') return true
    return (q.state ?? 'missing') === state
  }

  return allQuestions.value
    .filter((q) => matchesQuery(q))
    .filter((q) => matchesState(q))
    .filter((q) => (onlyOrphans.value ? isOrphan(q) : true))
    .filter((q) => (onlyIssues.value ? issueQuestionIds.value.has(q.id) : true))
})

const orphanQuestions = computed(() => filteredQuestions.value.filter(isOrphan))

const nonOrphanQuestionsByState = computed(() => {
  const byState = new Map<string, QuestionEntry[]>()
  for (const q of filteredQuestions.value) {
    if (isOrphan(q)) continue
    const key = q.state ?? 'missing'
    const arr = byState.get(key) ?? []
    arr.push(q)
    byState.set(key, arr)
  }

  const sortKey = (key: string) => {
    if (key === 'em-apuracao') return 0
    if (key === 'aberta') return 1
    if (key === 'parcial') return 2
    if (key === 'respondida') return 3
    if (key === 'refutada') return 4
    if (key === 'inconclusiva') return 5
    if (key === 'missing') return 6
    return 10
  }

  for (const arr of byState.values()) {
    arr.sort((a, b) => {
      const byContainer = a.container.id.localeCompare(b.container.id)
      if (byContainer !== 0) return byContainer
      return a.id.localeCompare(b.id)
    })
  }

  return [...byState.entries()].sort((a, b) => sortKey(a[0]) - sortKey(b[0]) || a[0].localeCompare(b[0]))
})

const stateOptions = computed(() => {
  const entries = Object.entries(data.value?.countsByState ?? {})
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  return entries.map(([state, count]) => ({ state, count }))
})

function stateLabel(state: string) {
  if (state === 'aberta') return 'Aberta'
  if (state === 'em-apuracao') return 'Em apuração'
  if (state === 'parcial') return 'Parcial'
  if (state === 'respondida') return 'Respondida'
  if (state === 'refutada') return 'Refutada'
  if (state === 'inconclusiva') return 'Inconclusiva'
  if (state === 'missing') return 'Sem estado'
  return state
}

function labelForNote(note: NoteRef) {
  return (note.title ?? note.id ?? note.url).trim()
}

function labelForContainer(container: QuestionContainer) {
  return (container.title ?? container.id).trim()
}

onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    const res = await fetch(withBase('/demos-data/questions.json'), { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Falha ao carregar /demos-data/questions.json (${res.status})`)
    }
    data.value = (await res.json()) as QuestionsData
  } catch (e: any) {
    error.value = e?.message ?? String(e)
    data.value = null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="demos-questions">
    <div v-if="loading" class="demos-questions__status">Carregando…</div>
    <div v-else-if="error" class="demos-questions__status demos-questions__status--error">{{ error }}</div>

    <template v-else-if="data">
      <div class="demos-questions__summary">
        <div class="demos-questions__summary-title">Backlog de perguntas</div>
        <div class="demos-questions__summary-meta">
          <span><b>Total:</b> {{ data.questionCount }}</span>
          <span><b>Sem trabalho:</b> {{ data.issues?.orphanQuestions?.length ?? 0 }}</span>
          <span><b>Backlinks faltando:</b> {{ data.issues?.missingBacklinks?.length ?? 0 }}</span>
          <span><b>Estados inconsistentes:</b> {{ data.issues?.inconsistentStates?.length ?? 0 }}</span>
        </div>
      </div>

      <div class="demos-questions__controls">
        <label class="demos-questions__field">
          <span>Buscar</span>
          <input v-model="query" class="demos-questions__input" type="search" placeholder="ID, pergunta, nota, pessoa…" />
        </label>

        <label class="demos-questions__field">
          <span>Estado</span>
          <select v-model="stateFilter" class="demos-questions__select">
            <option value="all">Todos</option>
            <option v-for="opt in stateOptions" :key="opt.state" :value="opt.state">
              {{ stateLabel(opt.state) }} ({{ opt.count }})
            </option>
          </select>
        </label>

        <label class="demos-questions__toggle">
          <input v-model="onlyOrphans" type="checkbox" />
          <span>Só sem trabalho</span>
        </label>

        <label class="demos-questions__toggle">
          <input v-model="onlyIssues" type="checkbox" />
          <span>Só com alertas</span>
        </label>
      </div>

      <details v-if="orphanQuestions.length > 0" class="demos-questions__section" open>
        <summary>
          Sem trabalho (prioridade do backlog)
          <span class="demos-questions__count">({{ orphanQuestions.length }})</span>
        </summary>

        <ul class="demos-questions__list">
          <li v-for="q in orphanQuestions" :key="q.id" class="demos-questions__item">
            <div class="demos-questions__item-head">
              <code class="demos-questions__mono">{{ q.id }}</code>
              <span class="demos-questions__badge">{{ stateLabel(q.state ?? 'missing') }}</span>
            </div>

            <div class="demos-questions__item-question">{{ q.question || '(sem texto de pergunta)' }}</div>

            <div class="demos-questions__item-meta">
              Em:
              <a :href="withBase(q.container.url)">{{ labelForContainer(q.container) }}</a>
              <code class="demos-questions__mono demos-questions__mono--muted">{{ q.container.id }}</code>
            </div>

            <div v-if="q.nextSteps" class="demos-questions__item-next">
              <b>Próximos passos:</b> {{ q.nextSteps }}
            </div>
          </li>
        </ul>
      </details>

      <details
        v-for="[state, questions] in nonOrphanQuestionsByState"
        :key="state"
        class="demos-questions__section"
        open
      >
        <summary>
          {{ stateLabel(state) }}
          <span class="demos-questions__count">({{ questions.length }})</span>
        </summary>

        <ul class="demos-questions__list">
          <li v-for="q in questions" :key="q.id" class="demos-questions__item">
            <div class="demos-questions__item-head">
              <code class="demos-questions__mono">{{ q.id }}</code>
              <span class="demos-questions__badge">{{ stateLabel(q.state ?? 'missing') }}</span>
            </div>

            <div class="demos-questions__item-question">{{ q.question || '(sem texto de pergunta)' }}</div>

            <div class="demos-questions__item-meta">
              Em:
              <a :href="withBase(q.container.url)">{{ labelForContainer(q.container) }}</a>
              <code class="demos-questions__mono demos-questions__mono--muted">{{ q.container.id }}</code>
            </div>

            <div v-if="q.targetedBy.length > 0" class="demos-questions__item-links">
              <b>Notas que avançam (rastreamento):</b>
              <span v-for="(n, idx) in q.targetedBy" :key="n.id ?? n.url">
                <span v-if="idx > 0">; </span>
                <a :href="withBase(n.url)">{{ labelForNote(n) }}</a>
              </span>
            </div>

            <div v-if="q.nextSteps" class="demos-questions__item-next">
              <b>Próximos passos:</b> {{ q.nextSteps }}
            </div>
          </li>
        </ul>
      </details>
    </template>
  </div>
</template>

<style scoped>
.demos-questions {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
}

.demos-questions__status {
  padding: 16px;
  background: var(--vp-c-bg-soft);
}

.demos-questions__status--error {
  color: var(--vp-c-danger-1);
}

.demos-questions__summary {
  padding: 14px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.demos-questions__summary-title {
  font-weight: 700;
  margin-bottom: 6px;
}

.demos-questions__summary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.demos-questions__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.demos-questions__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
}

.demos-questions__input,
.demos-questions__select {
  padding: 8px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.demos-questions__toggle {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  font-size: 14px;
}

.demos-questions__section {
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.demos-questions__section > summary {
  cursor: pointer;
  font-weight: 600;
}

.demos-questions__count {
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin-left: 6px;
}

.demos-questions__list {
  list-style: none;
  padding: 12px 0 4px 0;
  margin: 0;
  display: grid;
  gap: 12px;
}

.demos-questions__item {
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
}

.demos-questions__item-head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.demos-questions__mono {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.demos-questions__mono--muted {
  opacity: 0.85;
}

.demos-questions__badge {
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  color: var(--vp-c-text-2);
}

.demos-questions__item-question {
  font-size: 14px;
  margin-bottom: 8px;
}

.demos-questions__item-meta {
  font-size: 13px;
  color: var(--vp-c-text-2);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.demos-questions__item-links,
.demos-questions__item-next {
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.4;
}
</style>

