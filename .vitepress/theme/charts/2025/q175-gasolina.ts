import type { ChartInstance, ChartRenderInput } from '../types'
import { renderQ175Line } from './q175-line'

export const renderQ175Gasolina = (input: ChartRenderInput): ChartInstance => {
  return renderQ175Line(input)
}
