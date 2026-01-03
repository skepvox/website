export type EnemQuestionAreaCode =
  | 'linguagens'
  | 'humanas'
  | 'natureza'
  | 'matematica'

export type EnemQuestionArea = {
  code: EnemQuestionAreaCode
  name: string
}

export type EnemQuestionSubject = {
  code?: string
  name?: string
} | null

export type EnemQuestionContextSource = {
  author?: string | null
  title?: string | null
  publisher?: string | null
  location?: string | null
  year?: number | string | null
  url?: string | null
  access_date?: string | null
  note?: string | null
} | null

export type EnemQuestionContext = {
  type: 'text' | 'poem' | 'lyrics' | 'dialogue' | 'news' | 'academic'
  content: string
  source?: EnemQuestionContextSource
  language?: 'pt' | 'en' | 'es'
} | null

export type EnemQuestionOption = {
  letter: 'A' | 'B' | 'C' | 'D' | 'E'
  text: string
  latex?: string
  image?: string
  image_alt?: string
  chart?: EnemQuestionChartAsset
}

export type EnemQuestionImageAsset = {
  id: string
  file: string
  alt?: string
  caption?: string | null
  width?: number
  height?: number
  position?: 'context' | 'statement' | 'options'
}

export type EnemQuestionChartAsset = {
  id: string
  type: string
  data_file: string
  meta_file?: string
  position?: string
}

export type EnemQuestionTableAsset = {
  id: string
  headers: string[]
  rows: string[][]
  position?: string
}

export type EnemQuestionFormulaSegment = {
  type: 'text' | 'katex'
  value: string
  display?: 'inline' | 'block'
}

export type EnemQuestionFormulaAsset = {
  id: string
  latex?: string
  text?: string
  segments?: EnemQuestionFormulaSegment[]
  position?: string
}

export type EnemQuestionAssets = {
  images?: EnemQuestionImageAsset[]
  charts?: EnemQuestionChartAsset[]
  tables?: EnemQuestionTableAsset[]
  formulas?: EnemQuestionFormulaAsset[]
} | null

export type EnemQuestionMetadata = {
  page_in_pdf?: number | null
  caderno?: string
  caderno_position?: number
  foreign_language_option?: 'english' | 'spanish' | null
  has_image?: boolean
  has_chart?: boolean
  has_table?: boolean
  has_formula?: boolean
  annulled?: boolean
  reviewed?: boolean
  review_notes?: string | null
} | null

export type EnemQuestion = {
  id: string
  year: number
  day: 1 | 2
  number: number
  area: EnemQuestionArea
  subject?: EnemQuestionSubject
  competency?: string | null
  skill?: string | null
  context?: EnemQuestionContext
  statement: string
  options: EnemQuestionOption[]
  correct_answer?: 'A' | 'B' | 'C' | 'D' | 'E' | null
  assets?: EnemQuestionAssets
  metadata?: EnemQuestionMetadata
}
