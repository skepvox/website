import { withBase } from 'vitepress'
import type { EnemQuestion } from './types'

export type LoadQuestion = (questionId: string) => Promise<EnemQuestion>

export type QuestionIdParts = {
  year: number
  questionNumber: number
  questionSlug: string
}

export function parseQuestionId(questionId: string): QuestionIdParts | null {
  const match = questionId.trim().match(/^(\d{4})_q(\d{3})$/i)
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const questionSlug = `${match[1]}-${match[2]}`
  return {
    year,
    questionNumber: Number(match[2]),
    questionSlug
  }
}

export function buildQuestionUrl(questionId: string, baseUrl?: string): string {
  const parts = parseQuestionId(questionId)
  if (!parts) {
    throw new Error(`Invalid question id: ${questionId}`)
  }
  const path = `/enem/${parts.year}/questions/${parts.questionSlug}.json`
  if (baseUrl) {
    const trimmed = baseUrl.replace(/\/$/, '')
    return `${trimmed}${path}`
  }
  return withBase(path)
}

export async function loadQuestionFromPublic(
  questionId: string,
  baseUrl?: string
): Promise<EnemQuestion> {
  const url = buildQuestionUrl(questionId, baseUrl)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Question not found at ${url}`)
  }
  return (await response.json()) as EnemQuestion
}
