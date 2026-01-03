import type { ChartInstance, ChartRenderInput } from '../types'
import { renderQ180Line } from './q180-line'

export const renderQ180OptE = (input: ChartRenderInput): ChartInstance => {
  return renderQ180Line(input)
}
