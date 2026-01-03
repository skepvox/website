import type { ChartRenderer } from './types'
import { renderBarLineChart } from './shared/bar-line'
import { renderQ174Diagram } from './2025/q174-diagram'
import { renderQ145Respiratory } from './2025/q145-respiratory'
import { renderQ153Pie } from './2025/q153-pie'
import { renderQ153Bar } from './2025/q153-bar'
import { renderQ156Timeline } from './2025/q156-timeline'
import { renderQ162Bar } from './2025/q162-bar'
import { renderQ162Pie } from './2025/q162-pie'
import { renderQ163Compass } from './2025/q163-compass'
import { renderQ163Routes } from './2025/q163-routes'
import { renderQ175GNV } from './2025/q175-gnv'
import { renderQ175Gasolina } from './2025/q175-gasolina'
import { renderQ180OptA } from './2025/q180-opt-a'
import { renderQ180OptB } from './2025/q180-opt-b'
import { renderQ180OptC } from './2025/q180-opt-c'
import { renderQ180OptD } from './2025/q180-opt-d'
import { renderQ180OptE } from './2025/q180-opt-e'
import { renderQ151Diagram } from './2025/q151-diagram'
import { renderQ165Grid } from './2025/q165-grid'
import { renderQ147Diagram } from './2025/q147-diagram'
import { renderQ143Nutrition } from './2025/q143-nutrition'
import { renderQ167Projeto1 } from './2025/q167-projeto1'
import { renderQ167Projeto2 } from './2025/q167-projeto2'
import { renderQ171Medal } from './2025/q171-medal'
import { renderQ158Sun } from './2025/q158-sun'
import { renderQ136Polygons } from './2025/q136-polygons'
import { renderQ140Axis3d } from './2025/q140-axis3d'
import { renderQ164Tangent } from './2025/q164-tangent'
import { renderQ154Displacement } from './2025/q154-displacement'

const registry: Record<string, ChartRenderer> = {
  'bar-line': renderBarLineChart,
  'q174-diagram': renderQ174Diagram,
  'q145-respiratory': renderQ145Respiratory,
  'q153-pie': renderQ153Pie,
  'q153-bar': renderQ153Bar,
  'q156-timeline': renderQ156Timeline,
  'q162-bar': renderQ162Bar,
  'q162-pie': renderQ162Pie,
  'q163-compass': renderQ163Compass,
  'q163-routes': renderQ163Routes,
  'q175-gnv': renderQ175GNV,
  'q175-gasolina': renderQ175Gasolina,
  'q180-opt-a': renderQ180OptA,
  'q180-opt-b': renderQ180OptB,
  'q180-opt-c': renderQ180OptC,
  'q180-opt-d': renderQ180OptD,
  'q180-opt-e': renderQ180OptE,
  'q151-diagram': renderQ151Diagram,
  'q165-grid': renderQ165Grid,
  'q147-diagram': renderQ147Diagram,
  'q143-nutrition': renderQ143Nutrition,
  'q167-projeto1': renderQ167Projeto1,
  'q167-projeto2': renderQ167Projeto2,
  'q171-medal': renderQ171Medal,
  'q158-sun': renderQ158Sun,
  'q136-polygons': renderQ136Polygons,
  'q140-axis3d': renderQ140Axis3d,
  'q164-tangent': renderQ164Tangent,
  'q154-displacement': renderQ154Displacement
}

export const getChartRenderer = (type: string): ChartRenderer | null => {
  if (registry[type]) {
    return registry[type]
  }
  const match = type.match(/^\d{4}-(\d{3})-(.+)$/)
  if (match) {
    const legacyType = `q${match[1]}-${match[2]}`
    return registry[legacyType] || null
  }
  return null
}
