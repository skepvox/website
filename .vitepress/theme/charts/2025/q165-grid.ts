import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type GridLetter = {
  id: string
  row: number
  col: number
  placement?: 'center' | 'corner'
}

type CompassLabels = {
  north?: string
  south?: string
  west?: string
  east?: string
}

type GridData = {
  rows?: number
  cols?: number
  squareFill?: string
  squareStroke?: string
  letterColor?: string
  debug?: boolean
  letters?: GridLetter[]
  compass?: {
    labels?: CompassLabels
  }
}

const DEFAULT_FILL = '#c9c9c9'
const DEFAULT_LETTER_COLOR = '#2f2f2f'
const GAP_RATIO = 0.25

export const renderQ165Grid = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as GridData
    const debug = payload.debug ?? meta.debug ?? false
    const rows = payload.rows ?? 7
    const cols = payload.cols ?? 6
    const letters = payload.letters || []
    const squareFill = payload.squareFill || DEFAULT_FILL
    const squareStroke = payload.squareStroke || theme.textColor
    const letterColor = payload.letterColor || DEFAULT_LETTER_COLOR

    const margin = { top: 1, right: 12, bottom: 1, left: 12 }
    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = Math.max(0, height - margin.top - margin.bottom)

    if (innerWidth === 0 || innerHeight === 0) {
      return
    }

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Mapa de quarteiroes')
      .style('font-family', theme.fontFamily)

    if (debug) {
      svg
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'rgba(255, 0, 0, 0.06)')
        .attr('stroke', 'rgba(255, 0, 0, 0.3)')
    }

    const chart = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    if (debug) {
      chart
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'rgba(0, 128, 255, 0.05)')
        .attr('stroke', 'rgba(0, 128, 255, 0.3)')
    }

    const gridAreaWidth = innerWidth * 0.68
    const gridAreaHeight = innerHeight * 0.92

    const sizeFromHeight = gridAreaHeight / (rows + (rows - 1) * GAP_RATIO)
    const sizeFromWidth = gridAreaWidth / (cols + (cols - 1) * GAP_RATIO)
    const squareSize = Math.min(sizeFromHeight, sizeFromWidth)
    const gap = squareSize * GAP_RATIO

    const gridWidth = cols * squareSize + (cols - 1) * gap
    const gridHeight = rows * squareSize + (rows - 1) * gap

    const gridX = (gridAreaWidth - gridWidth) / 2
    const gridY = (innerHeight - gridHeight) / 2

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = gridX + col * (squareSize + gap)
        const y = gridY + row * (squareSize + gap)

        chart
          .append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', squareSize)
          .attr('height', squareSize)
          .attr('fill', squareFill)
          .attr('stroke', squareStroke)
          .attr('stroke-width', 1.5)
      }
    }

    const letterFontSize = Math.max(12, Math.round(squareSize * 0.32))

    letters.forEach((letter) => {
      const baseX = gridX + letter.col * (squareSize + gap)
      const baseY = gridY + letter.row * (squareSize + gap)
      const placement = letter.placement ?? (letter.id === 'A' ? 'corner' : 'center')

      if (placement === 'corner') {
        const cornerSize = squareSize * 0.45
        const cornerInset = squareSize * 0.04
        const cornerX = baseX + cornerInset
        const cornerY = baseY + cornerInset

        chart
          .append('rect')
          .attr('x', cornerX)
          .attr('y', cornerY)
          .attr('width', cornerSize)
          .attr('height', cornerSize)
          .attr('fill', '#111')

        chart
          .append('text')
          .attr('x', cornerX + cornerSize / 2)
          .attr('y', cornerY + cornerSize / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', Math.round(letterFontSize * 0.9))
          .text(letter.id)
        return
      }

      const x = baseX + squareSize / 2
      const y = baseY + squareSize / 2

      chart
        .append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', letterColor)
        .attr('font-size', letterFontSize)
        .text(letter.id)
    })

    const compassLabels: CompassLabels = {
      north: payload.compass?.labels?.north || 'N',
      south: payload.compass?.labels?.south || 'S',
      west: payload.compass?.labels?.west || 'O',
      east: payload.compass?.labels?.east || 'L'
    }

    const compassAreaX = gridAreaWidth
    const compassAreaWidth = innerWidth - gridAreaWidth
    const compassCenterX = compassAreaX + compassAreaWidth * 0.55 + 2
    const compassCenterY = innerHeight * 0.5
    const compassSize = Math.min(innerHeight * 0.22, compassAreaWidth * 0.4)

    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'q165-compass-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 7)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4Z')
      .attr('fill', theme.textColor)

    const compassGroup = chart.append('g')

    const drawCompassLine = (x2: number, y2: number) => {
      compassGroup
        .append('line')
        .attr('x1', compassCenterX)
        .attr('y1', compassCenterY)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', theme.textColor)
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#q165-compass-arrow)')
    }

    drawCompassLine(compassCenterX, compassCenterY - compassSize)
    drawCompassLine(compassCenterX, compassCenterY + compassSize)
    drawCompassLine(compassCenterX - compassSize, compassCenterY)
    drawCompassLine(compassCenterX + compassSize, compassCenterY)

    const compassLabelSize = 12
    const labelGap = 10

    compassGroup
      .append('text')
      .attr('x', compassCenterX)
      .attr('y', compassCenterY - compassSize - labelGap)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', theme.textColor)
      .attr('font-size', compassLabelSize)
      .text(compassLabels.north ?? '')

    compassGroup
      .append('text')
      .attr('x', compassCenterX)
      .attr('y', compassCenterY + compassSize + labelGap)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', theme.textColor)
      .attr('font-size', compassLabelSize)
      .text(compassLabels.south ?? '')

    const horizontalLabelY = compassCenterY

    compassGroup
      .append('text')
      .attr('x', compassCenterX - compassSize - labelGap + 2)
      .attr('y', horizontalLabelY)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', theme.textColor)
      .attr('font-size', compassLabelSize)
      .text(compassLabels.west ?? '')

    compassGroup
      .append('text')
      .attr('x', compassCenterX + compassSize + labelGap - 2)
      .attr('y', horizontalLabelY)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', theme.textColor)
      .attr('font-size', compassLabelSize)
      .text(compassLabels.east ?? '')
  }

  const update = (next: ChartRenderInput) => {
    state = { ...next }
    draw()
  }

  const destroy = () => {
    d3.select(state.el).selectAll('*').remove()
  }

  draw()

  return { update, destroy }
}
