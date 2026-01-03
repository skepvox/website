import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type DiagramData = {
  lagoonColor?: string
  ringColor?: string
  protectedColor?: string
  pointColor?: string
  centerAngle?: number
  halfAngle?: number
  labelText?: string
  debug?: boolean
}

const DEFAULT_LAGOON = '#3fe7f0'
const DEFAULT_PROTECTED = '#6b6b6b'
const DEFAULT_POINT = '#f2b705'

export const renderQ147Diagram = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as DiagramData
    const lagoonColor = payload.lagoonColor || DEFAULT_LAGOON
    const protectedColor = payload.protectedColor || DEFAULT_PROTECTED
    const pointColor = payload.pointColor || DEFAULT_POINT
    const centerAngle = payload.centerAngle ?? -0.5
    const halfAngle = payload.halfAngle ?? 0.2
    const labelText = payload.labelText || '200 m'
    const debug = payload.debug ?? false

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Diagrama da ciclovia')
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

    const circleAreaWidth = width * 0.66
    const verticalPadding = 1
    const maxRadiusByHeight = Math.max(0, height / 2 - verticalPadding)
    const radius = Math.min(maxRadiusByHeight, circleAreaWidth * 0.5)
    const centerX = width / 2
    const centerY = height / 2

    const ringThickness = radius * 0.08
    const innerRadius = radius - ringThickness

    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'q147-arrow-end')
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
      .attr('id', 'q147-arrow-start')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 1.5)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M8,-4L0,0L8,4Z')
      .attr('fill', theme.textColor)

    const group = svg.append('g')

    if (debug) {
      group
        .append('rect')
        .attr('x', centerX - radius)
        .attr('y', centerY - radius)
        .attr('width', radius * 2)
        .attr('height', radius * 2)
        .attr('fill', 'rgba(0, 128, 255, 0.05)')
        .attr('stroke', 'rgba(0, 128, 255, 0.3)')
    }

    group
      .append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', innerRadius)
      .attr('fill', lagoonColor)

    const toArcAngle = (angle: number) => angle + Math.PI / 2
    const arcCenter = toArcAngle(centerAngle)

    const arc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(arcCenter - halfAngle)
      .endAngle(arcCenter + halfAngle)

    group
      .append('path')
      .attr('d', arc())
      .attr('transform', `translate(${centerX}, ${centerY})`)
      .attr('fill', protectedColor)

    group
      .append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', innerRadius)
      .attr('fill', 'none')
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.5)

    group
      .append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.5)

    const pointRadius = innerRadius + ringThickness / 2
    const pointX = centerX + pointRadius * Math.cos(centerAngle)
    const pointY = centerY + pointRadius * Math.sin(centerAngle)

    group
      .append('circle')
      .attr('cx', pointX)
      .attr('cy', pointY)
      .attr('r', Math.max(3, ringThickness * 0.25))
      .attr('fill', pointColor)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 0.5)

    group
      .append('text')
      .attr('x', pointX - 12)
      .attr('y', pointY + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#111')
      .attr('font-size', 12)
      .attr('font-style', 'italic')
      .text('P')

    const arrowRadius = radius + ringThickness * 0.9
    const arcGap = 0.015

    const polar = (angle: number, r: number) => ({
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    })

    const leftStart = polar(centerAngle - halfAngle, arrowRadius)
    const leftEnd = polar(centerAngle - arcGap, arrowRadius)
    const rightStart = polar(centerAngle + arcGap, arrowRadius)
    const rightEnd = polar(centerAngle + halfAngle, arrowRadius)

    const drawArrowLine = (start: { x: number; y: number }, end: { x: number; y: number }) => {
      group
        .append('line')
        .attr('x1', start.x)
        .attr('y1', start.y)
        .attr('x2', end.x)
        .attr('y2', end.y)
        .attr('stroke', theme.textColor)
        .attr('stroke-width', 1.5)
        .attr('marker-start', 'url(#q147-arrow-start)')
        .attr('marker-end', 'url(#q147-arrow-end)')
    }

    drawArrowLine(leftStart, leftEnd)
    drawArrowLine(rightStart, rightEnd)

    const drawRadialTick = (angle: number, startRadius: number, length: number) => {
      const start = polar(angle, startRadius)
      const end = polar(angle, startRadius + length)
      group
        .append('line')
        .attr('x1', start.x)
        .attr('y1', start.y)
        .attr('x2', end.x)
        .attr('y2', end.y)
        .attr('stroke', theme.textColor)
        .attr('stroke-width', 1.5)
    }

    const tickLength = ringThickness * 0.8
    const outerTickLength = ringThickness * 1.8
    drawRadialTick(centerAngle, radius, tickLength)
    drawRadialTick(centerAngle - halfAngle, innerRadius, outerTickLength)
    drawRadialTick(centerAngle + halfAngle, innerRadius, outerTickLength)

    const labelRadius = arrowRadius + ringThickness * 3
    const leftLabelAngle = (centerAngle - halfAngle + centerAngle - arcGap) / 2
    const rightLabelAngle = (centerAngle + arcGap + centerAngle + halfAngle) / 2

    const placeLabel = (angle: number) => {
      const x = centerX + labelRadius * Math.cos(angle)
      const baseY = centerY + labelRadius * Math.sin(angle)
      const extraOffset = baseY < centerY ? ringThickness * 0.3 : 0
      const y = baseY + ringThickness * 0.6 + extraOffset
      group
        .append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .text(labelText)
    }

    placeLabel(leftLabelAngle)
    placeLabel(rightLabelAngle)
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
