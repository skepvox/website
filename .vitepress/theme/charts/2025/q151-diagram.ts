import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type DiagramPoint = {
  id: string
  x: number
  y: number
  label?: string
  labelDx?: number
  labelDy?: number
  labelAnchor?: 'start' | 'middle' | 'end'
}

type DiagramData = {
  xMax?: number
  yMax?: number
  axisLabelX?: string
  axisLabelY?: string
  squareFill?: string
  pointRadius?: number
  debug?: boolean
  points?: DiagramPoint[]
  polygon?: string[]
}

const DEFAULT_FILL = '#bff6fb'

export const renderQ151Diagram = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as DiagramData
    const points = payload.points || []
    const polygonIds = payload.polygon || []
    const axisLabelX = payload.axisLabelX || 'x'
    const axisLabelY = payload.axisLabelY || 'y'
    const pointRadius = payload.pointRadius ?? 4
    const debug = payload.debug ?? false

    const maxX = payload.xMax ?? Math.max(10, ...points.map((point) => point.x))
    const maxY = payload.yMax ?? Math.max(10, ...points.map((point) => point.y))

    const margin = { top: 10, right: 20, bottom: 10, left: 32 }
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
      .attr('aria-label', meta.title || 'Diagrama do plano cartesiano')
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
      .attr('id', 'q151-axis-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 7)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4Z')
      .attr('fill', theme.textColor)

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

    const scale = Math.min(innerWidth / maxX, innerHeight / maxY)
    const usedWidth = maxX * scale
    const usedHeight = maxY * scale

    const plot = chart
      .append('g')
      .attr(
        'transform',
        `translate(${(innerWidth - usedWidth) / 2}, ${(innerHeight - usedHeight) / 2})`
      )

    const x = d3.scaleLinear().domain([0, maxX]).range([0, usedWidth])
    const y = d3.scaleLinear().domain([0, maxY]).range([usedHeight, 0])

    plot
      .append('line')
      .attr('x1', x(0))
      .attr('x2', x(maxX))
      .attr('y1', y(0))
      .attr('y2', y(0))
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#q151-axis-arrow)')

    plot
      .append('line')
      .attr('x1', x(0))
      .attr('x2', x(0))
      .attr('y1', y(0))
      .attr('y2', y(maxY))
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#q151-axis-arrow)')

    plot
      .append('text')
      .attr('x', x(0) - 6)
      .attr('y', y(0) + 4)
      .attr('text-anchor', 'end')
      .attr('fill', theme.textColor)
      .attr('font-size', 12)
      .text('0')

    plot
      .append('text')
      .attr('x', x(maxX) + 10)
      .attr('y', y(0) + 4)
      .attr('text-anchor', 'start')
      .attr('fill', theme.textColor)
      .attr('font-size', 13)
      .attr('font-style', 'italic')
      .text(axisLabelX)

    plot
      .append('text')
      .attr('x', x(0) - 11)
      .attr('y', y(maxY) + 12)
      .attr('text-anchor', 'end')
      .attr('fill', theme.textColor)
      .attr('font-size', 13)
      .attr('font-style', 'italic')
      .text(axisLabelY)

    if (polygonIds.length > 2) {
      const pointMap = new Map(points.map((point) => [point.id, point]))
      const polygonPoints = polygonIds
        .map((id) => pointMap.get(id))
        .filter((point): point is DiagramPoint => Boolean(point))

      if (polygonPoints.length > 2) {
        const line = d3
          .line<DiagramPoint>()
          .x((d) => x(d.x))
          .y((d) => y(d.y))
          .curve(d3.curveLinearClosed)

        plot
          .append('path')
          .datum(polygonPoints)
          .attr('d', line)
          .attr('fill', payload.squareFill || DEFAULT_FILL)
          .attr('stroke', 'none')
      }
    }

    points.forEach((point) => {
      const cx = x(point.x)
      const cy = y(point.y)

      plot
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', pointRadius)
        .attr('fill', theme.textColor)

      if (point.label) {
        plot
          .append('text')
          .attr('x', cx + (point.labelDx ?? 0))
          .attr('y', cy + (point.labelDy ?? -10))
          .attr('text-anchor', point.labelAnchor || 'middle')
          .attr('fill', theme.textColor)
          .attr('font-size', 12)
          .attr('font-style', 'italic')
          .text(point.label)
      }
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
