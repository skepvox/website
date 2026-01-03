import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type DisplacementPanel = {
  id: string // Roman numeral (I, II, III, IV, V)
  startPoint: string // Label for start point (A, B, C, D, E, F)
  endPoint: string // Label for end point
  startPos: [number, number] // Relative position in panel [0-1, 0-1]
  endPos: [number, number]
  length: string // e.g. "9 cm"
  lengthPos?: [number, number] // Optional relative position for length label
  startLabelOffset?: [number, number] // Optional relative offset for start label
  endLabelOffset?: [number, number] // Optional relative offset for end label
  scale: string // e.g. "1 : 100"
}

type DisplacementData = {
  panels?: DisplacementPanel[]
  debug?: boolean
}

export const renderQ154Displacement = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as DisplacementData
    const debug = payload.debug ?? meta.debug ?? false
    const panels = payload.panels || []

    const margin = { top: 6, right: 6, bottom: 14, left: 6 }
    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = Math.max(0, height - margin.top - margin.bottom)

    if (innerWidth === 0 || innerHeight === 0) return

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Deslocamentos em escala')
      .style('font-family', theme.fontFamily)

    if (debug) {
      svg.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', width).attr('height', height)
        .attr('fill', 'rgba(255, 0, 0, 0.06)')
        .attr('stroke', 'rgba(255, 0, 0, 0.3)')
    }

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const panelCount = panels.length
    if (panelCount === 0) return

    const gap = 10
    const totalGaps = (panelCount - 1) * gap
    const panelWidth = (innerWidth - totalGaps) / panelCount
    const romanFontSize = Math.max(12, Math.min(14, panelWidth / 7))
    const romanGap = romanFontSize + 6
    const panelHeight = innerHeight - romanGap
    if (panelWidth <= 0 || panelHeight <= 0) return

    const lineColor = '#1f3f99'
    const dotColor = '#e53935'
    const borderColor = '#7d7d7d'
    const panelFill = '#ffffff'
    const panelTextColor = '#1f1f1f'

    panels.forEach((panel, i) => {
      const panelX = i * (panelWidth + gap)
      const panelY = 0

      const panelG = chart.append('g')
        .attr('transform', `translate(${panelX}, ${panelY})`)

      // Panel frame (gray border with white/light fill)
      const borderWidth = Math.max(4, panelWidth * 0.045)
      panelG.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', panelWidth)
        .attr('height', panelHeight)
        .attr('fill', panelFill)
        .attr('stroke', borderColor)
        .attr('stroke-width', borderWidth)

      // Inner content area
      const contentPadding = Math.max(8, panelWidth * 0.075)
      const contentWidth = panelWidth - contentPadding * 2
      const contentHeight = panelHeight - contentPadding * 2

      // Calculate line positions
      const x1 = contentPadding + panel.startPos[0] * contentWidth
      const y1 = contentPadding + panel.startPos[1] * contentHeight
      const x2 = contentPadding + panel.endPos[0] * contentWidth
      const y2 = contentPadding + panel.endPos[1] * contentHeight

      const angle = Math.atan2(y2 - y1, x2 - x1)
      const lineLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
      if (lineLen === 0) return
      const dx = (x2 - x1) / lineLen
      const dy = (y2 - y1) / lineLen

      // Draw main line
      panelG.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', lineColor)
        .attr('stroke-width', Math.max(1.8, panelWidth * 0.015))

      // Draw arrow ticks along the line
      const arrowSize = Math.max(6, panelWidth * 0.06)
      const arrowAngle = Math.PI / 6
      const arrowSpacing = Math.min(lineLen * 0.12, arrowSize * 1.2)
      const arrowPositions = [0.5 - arrowSpacing / lineLen, 0.5 + arrowSpacing / lineLen]
        .filter((t) => t > 0.25 && t < 0.75)

      const drawArrow = (t: number) => {
        const ax = x1 + (x2 - x1) * t
        const ay = y1 + (y2 - y1) * t
        const leftAngle = angle + Math.PI - arrowAngle
        const rightAngle = angle + Math.PI + arrowAngle
        panelG.append('line')
          .attr('x1', ax)
          .attr('y1', ay)
          .attr('x2', ax + Math.cos(leftAngle) * arrowSize)
          .attr('y2', ay + Math.sin(leftAngle) * arrowSize)
          .attr('stroke', lineColor)
          .attr('stroke-width', Math.max(1.4, panelWidth * 0.012))
        panelG.append('line')
          .attr('x1', ax)
          .attr('y1', ay)
          .attr('x2', ax + Math.cos(rightAngle) * arrowSize)
          .attr('y2', ay + Math.sin(rightAngle) * arrowSize)
          .attr('stroke', lineColor)
          .attr('stroke-width', Math.max(1.4, panelWidth * 0.012))
      }

      arrowPositions.forEach(drawArrow)

      // Draw endpoint dots
      const dotRadius = Math.max(3.5, panelWidth * 0.02)

      panelG.append('circle')
        .attr('cx', x1)
        .attr('cy', y1)
        .attr('r', dotRadius)
        .attr('fill', dotColor)

      panelG.append('circle')
        .attr('cx', x2)
        .attr('cy', y2)
        .attr('r', dotRadius)
        .attr('fill', dotColor)

      // Point labels (positioned near dots)
      const fontSize = Math.max(11, Math.min(14, panelWidth / 8))
      const labelOffsetX = Math.max(10, panelWidth * 0.09)
      const labelOffsetY = Math.max(9, panelHeight * 0.08)

      const resolveLabel = (pos: [number, number]) => {
        const [rx, ry] = pos
        let dx = 0
        let dy = 0
        let anchor: 'start' | 'middle' | 'end' = 'middle'
        let baseline: 'middle' | 'alphabetic' = 'middle'
        if (rx < 0.35) {
          dx = -labelOffsetX
          anchor = 'end'
        } else if (rx > 0.45) {
          dx = labelOffsetX
          anchor = 'start'
        }
        if (ry < 0.45) {
          dy = -labelOffsetY
          baseline = 'alphabetic'
        } else if (ry > 0.55) {
          dy = labelOffsetY
          baseline = 'alphabetic'
        }
        return { dx, dy, anchor, baseline }
      }

      const startLabel = resolveLabel(panel.startPos)
      const startOffset = panel.startLabelOffset || [0, 0]
      panelG.append('text')
        .attr('x', x1 + startLabel.dx + startOffset[0] * contentWidth)
        .attr('y', y1 + startLabel.dy + startOffset[1] * contentHeight)
        .attr('text-anchor', startLabel.anchor)
        .attr('dominant-baseline', startLabel.baseline)
        .attr('fill', dotColor)
        .attr('font-size', fontSize)
        .attr('font-style', 'italic')
        .text(panel.startPoint)

      const endLabel = resolveLabel(panel.endPos)
      const endOffset = panel.endLabelOffset || [0, 0]
      panelG.append('text')
        .attr('x', x2 + endLabel.dx + endOffset[0] * contentWidth)
        .attr('y', y2 + endLabel.dy + endOffset[1] * contentHeight)
        .attr('text-anchor', endLabel.anchor)
        .attr('dominant-baseline', endLabel.baseline)
        .attr('fill', dotColor)
        .attr('font-size', fontSize)
        .attr('font-style', 'italic')
        .text(panel.endPoint)

      // Length label (positioned perpendicular to line, on one side)
      let lengthLabelX = (x1 + x2) / 2
      let lengthLabelY = (y1 + y2) / 2
      if (panel.lengthPos) {
        lengthLabelX = contentPadding + panel.lengthPos[0] * contentWidth
        lengthLabelY = contentPadding + panel.lengthPos[1] * contentHeight
      } else {
        const perpAngle = angle + Math.PI / 2
        const lengthLabelOffset = Math.max(12, panelWidth * 0.12)
        lengthLabelX = lengthLabelX - Math.cos(perpAngle) * lengthLabelOffset
        lengthLabelY = lengthLabelY - Math.sin(perpAngle) * lengthLabelOffset
      }

      panelG.append('text')
        .attr('x', lengthLabelX)
        .attr('y', lengthLabelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', panelTextColor)
        .attr('font-size', fontSize)
        .text(panel.length)

      // Scale label (bottom right of panel)
      const scalePadding = Math.max(8, panelWidth * 0.06)
      panelG.append('text')
        .attr('x', panelWidth - scalePadding)
        .attr('y', panelHeight - scalePadding)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'auto')
        .attr('fill', panelTextColor)
        .attr('font-size', fontSize - 1)
        .text(panel.scale)

      // Roman numeral below panel
      chart.append('text')
        .attr('x', panelX + panelWidth / 2)
        .attr('y', panelHeight + romanGap - 2)
        .attr('text-anchor', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', romanFontSize)
        .text(panel.id)
    })
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
