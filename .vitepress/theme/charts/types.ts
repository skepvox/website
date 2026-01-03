export type ChartSeriesKind = 'bar' | 'line'

export type ChartSeries = {
  id: string
  label: string
  kind: ChartSeriesKind
  field: string
  color?: string
}

export type ChartAxis = {
  label?: string
  min?: number
  max?: number
  ticks?: number
  format?: string
}

export type ChartMetaBase = {
  id: string
  type: string
  title?: string
  description?: string
  width?: number
  height?: number
  aspectRatio?: number
  debug?: boolean
}

export type BarLineMeta = ChartMetaBase & {
  type: 'bar-line'
  categoryField: string
  series: ChartSeries[]
  yAxis?: ChartAxis
}

export type ChartMeta = ChartMetaBase | BarLineMeta

export type ChartTheme = {
  textColor: string
  mutedTextColor: string
  axisColor: string
  gridColor: string
  fontFamily: string
}

export type ChartData = Record<string, unknown>

export type ChartRenderInput = {
  el: HTMLElement
  data: ChartData[]
  meta: ChartMeta
  theme: ChartTheme
  width: number
  height: number
}

export type ChartInstance = {
  update: (input: ChartRenderInput) => void
  destroy: () => void
}

export type ChartRenderer = (input: ChartRenderInput) => ChartInstance
