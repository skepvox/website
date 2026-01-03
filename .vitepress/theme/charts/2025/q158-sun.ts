import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type SunData = {
  diameter?: number
  unit?: number
  coreRatio?: number
  rayBaseRatio?: number
  rayCount?: number
  rayAngle?: number
  sunColor?: string
  lineColor?: string
  dimensionLabel?: string
  debug?: boolean
}

export const renderQ158Sun = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as SunData
    const diameter = payload.diameter ?? 20
    const unit = payload.unit ?? 10
    const coreRatio = payload.coreRatio ?? 0.47
    const rayBaseRatio = payload.rayBaseRatio ?? 0.62
    const rayCount = payload.rayCount ?? 8
    const rayAngle = (payload.rayAngle ?? 26) * (Math.PI / 180)
    const sunColor = payload.sunColor ?? '#f2b705'
    const lineColor = payload.lineColor ?? theme.textColor
    const dimensionLabel = payload.dimensionLabel ?? `${diameter} cm`
    const debug = payload.debug ?? meta.debug ?? false

    const diameterPx = diameter * unit
    const outerRadius = diameterPx / 2
    const coreRadius = outerRadius * coreRatio
    const rayBaseRadius = outerRadius * rayBaseRatio
    const extensionOffset = outerRadius * 0.03
    const rightMeasureOffset = outerRadius * 0.35
    const bottomMeasureOffset = outerRadius * 0.23
    const layoutOffsetX = 30
    const arrowSize = outerRadius * 0.06
    const lineWidth = 1

    const topExtY = -outerRadius - extensionOffset
    const bottomExtY = outerRadius + extensionOffset
    const bottomDimY = outerRadius + bottomMeasureOffset
    const leftExtX = -outerRadius - extensionOffset
    const rightExtX = outerRadius + extensionOffset
    const rightMeasureX = outerRadius + rightMeasureOffset

    const baseFontSize = 12
    const labelGap = 8
    const labelWidth = dimensionLabel.length * baseFontSize * 0.55

    const minX = leftExtX - arrowSize
    const maxX = rightMeasureX + labelGap + labelWidth + arrowSize
    const minY = topExtY - arrowSize
    const maxY = bottomDimY + labelGap + baseFontSize + arrowSize

    const layoutWidth = maxX - minX
    const layoutHeight = maxY - minY

    const margin = { top: 6, right: 6, bottom: 6, left: 6 }
    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = Math.max(0, height - margin.top - margin.bottom)

    if (innerWidth === 0 || innerHeight === 0) {
      return
    }

    const scale = Math.min(1, innerWidth / layoutWidth, innerHeight / layoutHeight)
    const usedWidth = layoutWidth * scale
    const usedHeight = layoutHeight * scale
    const fontScale = scale > 0 ? 1 / scale : 1
    const labelFont = baseFontSize * fontScale
    const labelGapScaled = labelGap * fontScale

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Diagrama do sol com medidas')
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

      svg
        .append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'rgba(0, 128, 255, 0.05)')
        .attr('stroke', 'rgba(0, 128, 255, 0.3)')
    }

    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'q158-arrow-end')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 7)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4Z')
      .attr('fill', lineColor)

    defs
      .append('marker')
      .attr('id', 'q158-arrow-start')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 1)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M8,-4L0,0L8,4Z')
      .attr('fill', lineColor)

    const plot = svg
      .append('g')
      .attr(
        'transform',
        `translate(${margin.left + (innerWidth - usedWidth) / 2 - minX * scale + layoutOffsetX}, ${
          margin.top + (innerHeight - usedHeight) / 2 - minY * scale
        }) scale(${scale})`
      )

    const step = (Math.PI * 2) / rayCount
    const startAngle = -Math.PI / 2
    const halfAngle = rayAngle / 2

    for (let i = 0; i < rayCount; i += 1) {
      const angle = startAngle + i * step
      const tipX = Math.cos(angle) * outerRadius
      const tipY = Math.sin(angle) * outerRadius
      const baseLeftX = Math.cos(angle - halfAngle) * rayBaseRadius
      const baseLeftY = Math.sin(angle - halfAngle) * rayBaseRadius
      const baseRightX = Math.cos(angle + halfAngle) * rayBaseRadius
      const baseRightY = Math.sin(angle + halfAngle) * rayBaseRadius

      plot
        .append('polygon')
        .attr('points', `${tipX},${tipY} ${baseRightX},${baseRightY} ${baseLeftX},${baseLeftY}`)
        .attr('fill', sunColor)
    }

    plot
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', coreRadius)
      .attr('fill', sunColor)

    plot
      .append('line')
      .attr('x1', leftExtX)
      .attr('x2', rightExtX)
      .attr('y1', bottomDimY)
      .attr('y2', bottomDimY)
      .attr('stroke', lineColor)
      .attr('stroke-width', lineWidth)
      .attr('marker-start', 'url(#q158-arrow-start)')
      .attr('marker-end', 'url(#q158-arrow-end)')

    plot
      .append('line')
      .attr('x1', leftExtX)
      .attr('x2', leftExtX)
      .attr('y1', 0)
      .attr('y2', bottomDimY)
      .attr('stroke', lineColor)
      .attr('stroke-width', lineWidth)

    plot
      .append('line')
      .attr('x1', rightExtX)
      .attr('x2', rightExtX)
      .attr('y1', 0)
      .attr('y2', bottomDimY)
      .attr('stroke', lineColor)
      .attr('stroke-width', lineWidth)

    plot
      .append('line')
      .attr('x1', rightMeasureX)
      .attr('x2', rightMeasureX)
      .attr('y1', topExtY)
      .attr('y2', bottomExtY)
      .attr('stroke', lineColor)
      .attr('stroke-width', lineWidth)
      .attr('marker-start', 'url(#q158-arrow-start)')
      .attr('marker-end', 'url(#q158-arrow-end)')

    plot
      .append('line')
      .attr('x1', 0)
      .attr('x2', rightMeasureX)
      .attr('y1', topExtY)
      .attr('y2', topExtY)
      .attr('stroke', lineColor)
      .attr('stroke-width', lineWidth)

    plot
      .append('line')
      .attr('x1', 0)
      .attr('x2', rightMeasureX)
      .attr('y1', bottomExtY)
      .attr('y2', bottomExtY)
      .attr('stroke', lineColor)
      .attr('stroke-width', lineWidth)

    plot
      .append('text')
      .attr('x', (leftExtX + rightExtX) / 2)
      .attr('y', bottomDimY + labelGapScaled + labelFont * 0.3 + 3)
      .attr('text-anchor', 'middle')
      .attr('fill', lineColor)
      .attr('font-size', labelFont)
      .text(dimensionLabel)

    plot
      .append('text')
      .attr('x', rightMeasureX + labelGapScaled)
      .attr('y', (topExtY + bottomExtY) / 2 + labelFont * 0.35)
      .attr('text-anchor', 'start')
      .attr('fill', lineColor)
      .attr('font-size', labelFont)
      .text(dimensionLabel)
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
