import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type MedalData = {
  diameter?: number
  thickness?: number
  unit?: number
  debug?: boolean
  diameterLabel?: string
  thicknessLabel?: string
  outerColor?: string
  edgeColor?: string
  squareColor?: string
}

export const renderQ171Medal = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as MedalData
    const diameter = payload.diameter ?? 6
    const thickness = payload.thickness ?? 0.3
    const unit = payload.unit ?? 24
    const debug = payload.debug ?? false
    const diameterLabel = payload.diameterLabel ?? '6 cm'
    const thicknessLabel = payload.thicknessLabel ?? '3 mm'
    const outerColor = payload.outerColor ?? '#f2b705'
    const edgeColor = payload.edgeColor ?? '#d39a1f'
    const squareColor = payload.squareColor ?? '#b8b8b8'

    const diameterPx = diameter * unit
    const thicknessPx = thickness * unit
    const displayThickness = thicknessPx * 1.7
    const radius = diameterPx / 2
    const leftMargin = diameterPx * 0.45
    const rightMargin = diameterPx * 0.25
    const gap = diameterPx * 0.08
    const topMargin = diameterPx * 0.22
    const bottomMargin = diameterPx * 0.24
    const layoutWidth = leftMargin + diameterPx + gap + diameterPx + rightMargin
    const layoutHeight = diameterPx + topMargin + bottomMargin

    const margin = { top: 0, right: 16, bottom: 0, left: 16 }
    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = Math.max(0, height - margin.top - margin.bottom)

    if (innerWidth === 0 || innerHeight === 0) {
      return
    }

    const scale = Math.min(1, innerWidth / layoutWidth, innerHeight / layoutHeight)
    const usedWidth = layoutWidth * scale
    const usedHeight = layoutHeight * scale
    const fontScale = scale > 0 ? 1 / scale : 1
    const annotationFont = 12 * fontScale
    const pointFont = 13 * fontScale

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Medalha com quadrado inscrito')
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

    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'q171-arrow-end')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 6.5)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4Z')
      .attr('fill', theme.textColor)

    defs
      .append('marker')
      .attr('id', 'q171-arrow-start')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 1.5)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M8,-4L0,0L8,4Z')
      .attr('fill', theme.textColor)

    const plot = svg
      .append('g')
      .attr(
        'transform',
        `translate(${margin.left + (innerWidth - usedWidth) / 2}, ${
          margin.top + (innerHeight - usedHeight) / 2
        }) scale(${scale})`
      )

    if (debug) {
      plot
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', layoutWidth)
        .attr('height', layoutHeight)
        .attr('fill', 'rgba(0, 128, 255, 0.05)')
        .attr('stroke', 'rgba(0, 128, 255, 0.3)')
    }

    const circleCx = leftMargin + radius
    const circleCy = topMargin + radius
    const circleTop = circleCy - radius
    const circleBottom = circleCy + radius
    const arrowX = leftMargin * 0.45
    const labelOffset = diameterPx * 0.12
    const sideLabelOffset = diameterPx * 0.06

    const squarePoints: [number, number][] = [
      [circleCx, circleTop],
      [circleCx + radius, circleCy],
      [circleCx, circleBottom],
      [circleCx - radius, circleCy]
    ]

    plot
      .append('circle')
      .attr('cx', circleCx)
      .attr('cy', circleCy)
      .attr('r', radius)
      .attr('fill', outerColor)
      .attr('stroke', edgeColor)
      .attr('stroke-width', 1.4)

    plot
      .append('polygon')
      .attr('points', squarePoints.map((point) => point.join(',')).join(' '))
      .attr('fill', squareColor)

    plot
      .append('line')
      .attr('x1', arrowX)
      .attr('x2', circleCx)
      .attr('y1', circleTop)
      .attr('y2', circleTop)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 4')

    plot
      .append('line')
      .attr('x1', arrowX)
      .attr('x2', circleCx)
      .attr('y1', circleBottom)
      .attr('y2', circleBottom)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4')

    plot
      .append('line')
      .attr('x1', arrowX)
      .attr('x2', arrowX)
      .attr('y1', circleTop)
      .attr('y2', circleBottom)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.2)
      .attr('marker-start', 'url(#q171-arrow-start)')
      .attr('marker-end', 'url(#q171-arrow-end)')

    plot
      .append('text')
      .attr('x', arrowX - diameterPx * 0.08)
      .attr('y', circleCy + 0.3)
      .attr('text-anchor', 'end')
      .attr('fill', theme.textColor)
      .attr('font-size', annotationFont)
      .text(diameterLabel)

    plot
      .append('text')
      .attr('x', circleCx)
      .attr('y', circleTop - sideLabelOffset)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.textColor)
      .attr('font-size', pointFont)
      .attr('font-style', 'italic')
      .text('A')

    plot
      .append('text')
      .attr('x', circleCx + radius + sideLabelOffset)
      .attr('y', circleCy + 3.5)
      .attr('text-anchor', 'start')
      .attr('fill', theme.textColor)
      .attr('font-size', pointFont)
      .attr('font-style', 'italic')
      .text('B')

    plot
      .append('text')
      .attr('x', circleCx)
      .attr('y', circleBottom + labelOffset + 0.4)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.textColor)
      .attr('font-size', pointFont)
      .attr('font-style', 'italic')
      .text('C')

    plot
      .append('text')
      .attr('x', circleCx - radius - sideLabelOffset)
      .attr('y', circleCy + 3.5)
      .attr('text-anchor', 'end')
      .attr('fill', theme.textColor)
      .attr('font-size', pointFont)
      .attr('font-style', 'italic')
      .text('D')

    const cylinderCx = leftMargin + diameterPx + gap + radius
    const ellipseRx = radius
    const ellipseRy = radius * 0.2
    const bottomFaceY = circleBottom - ellipseRy
    const topFaceY = bottomFaceY - displayThickness

    plot
      .append('rect')
      .attr('x', cylinderCx - ellipseRx)
      .attr('y', topFaceY)
      .attr('width', ellipseRx * 2)
      .attr('height', displayThickness)
      .attr('fill', outerColor)

    plot
      .append('line')
      .attr('x1', cylinderCx - ellipseRx)
      .attr('x2', cylinderCx - ellipseRx)
      .attr('y1', topFaceY)
      .attr('y2', bottomFaceY)
      .attr('stroke', edgeColor)
      .attr('stroke-width', 1.2)

    plot
      .append('line')
      .attr('x1', cylinderCx + ellipseRx)
      .attr('x2', cylinderCx + ellipseRx)
      .attr('y1', topFaceY)
      .attr('y2', bottomFaceY)
      .attr('stroke', edgeColor)
      .attr('stroke-width', 1.2)

    plot
      .append('ellipse')
      .attr('cx', cylinderCx)
      .attr('cy', bottomFaceY)
      .attr('rx', ellipseRx)
      .attr('ry', ellipseRy)
      .attr('fill', outerColor)
      .attr('stroke', edgeColor)
      .attr('stroke-width', 1.2)

    const topSquarePoints: [number, number][] = [
      [cylinderCx, topFaceY - ellipseRy],
      [cylinderCx + ellipseRx, topFaceY],
      [cylinderCx, topFaceY + ellipseRy],
      [cylinderCx - ellipseRx, topFaceY]
    ]

    plot
      .append('ellipse')
      .attr('cx', cylinderCx)
      .attr('cy', topFaceY)
      .attr('rx', ellipseRx)
      .attr('ry', ellipseRy)
      .attr('fill', outerColor)

    plot
      .append('polygon')
      .attr('points', topSquarePoints.map((point) => point.join(',')).join(' '))
      .attr('fill', squareColor)

    plot
      .append('ellipse')
      .attr('cx', cylinderCx)
      .attr('cy', topFaceY)
      .attr('rx', ellipseRx)
      .attr('ry', ellipseRy)
      .attr('fill', 'none')
      .attr('stroke', edgeColor)
      .attr('stroke-width', 1.2)

    plot
      .append('line')
      .attr('x1', cylinderCx)
      .attr('x2', cylinderCx)
      .attr('y1', topFaceY + displayThickness * 0.12 + 14)
      .attr('y2', bottomFaceY - displayThickness * 0.12 + 16)
      .attr('stroke', edgeColor)
      .attr('stroke-opacity', 0.55)
      .attr('stroke-width', 1)

    const thicknessArrowX = cylinderCx + ellipseRx + diameterPx * 0.08
    plot
      .append('line')
      .attr('x1', thicknessArrowX)
      .attr('x2', thicknessArrowX)
      .attr('y1', topFaceY)
      .attr('y2', bottomFaceY)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.2)
      .attr('marker-start', 'url(#q171-arrow-start)')
      .attr('marker-end', 'url(#q171-arrow-end)')

    plot
      .append('text')
      .attr('x', thicknessArrowX + diameterPx * 0.035)
      .attr('y', (topFaceY + bottomFaceY) / 2 + 3.5)
      .attr('text-anchor', 'start')
      .attr('fill', theme.textColor)
      .attr('font-size', annotationFont)
      .text(thicknessLabel)
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
