import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type LinePoint = {
  x: number
  y: number
}

type LineData = {
  points?: LinePoint[]
  xTicks?: number[]
  yTicks?: number[]
  xLabel?: string
  seriesLabel?: string
  lineColor?: string
}

const DEFAULT_LINE_COLOR = '#00a3e8'

export const renderQ175Line = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as LineData
    const points = payload.points || []
    const xTicks = payload.xTicks || [0, 20, 40, 60, 80, 100, 120, 140]
    const yTicks = payload.yTicks || [0, 2, 4, 6, 8, 10, 12, 14]
    const xLabel = payload.xLabel || 'Velocidade (km/h)'
    const seriesLabel = payload.seriesLabel || ''
    const lineColor = payload.lineColor || DEFAULT_LINE_COLOR

    const xMax = Math.max(...xTicks, ...points.map((point) => point.x))
    const yMax = Math.max(...yTicks, ...points.map((point) => point.y))

    const margin = { top: 36, right: 48, bottom: 48, left: 36 }
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
      .attr('aria-label', meta.title || 'Grafico de rendimento')
      .style('font-family', theme.fontFamily)

    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'q175-axis-arrow')
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

    if (meta.title) {
      chart
        .append('text')
        .attr('x', 0)
        .attr('y', -12)
        .attr('text-anchor', 'start')
        .attr('fill', theme.textColor)
        .attr('font-size', 14)
        .text(meta.title)
    }

    const x = d3.scaleLinear().domain([0, xMax]).range([0, innerWidth])
    const y = d3.scaleLinear().domain([0, yMax]).range([innerHeight, 0])

    xTicks
      .filter((tick) => tick !== 0)
      .forEach((tick) => {
        chart
          .append('line')
          .attr('x1', x(tick))
          .attr('x2', x(tick))
          .attr('y1', 0)
          .attr('y2', innerHeight)
          .attr('stroke', theme.gridColor)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4 4')
      })

    yTicks
      .filter((tick) => tick !== 0)
      .forEach((tick) => {
        chart
          .append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', y(tick))
          .attr('y2', y(tick))
          .attr('stroke', theme.gridColor)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4 4')
      })

    chart
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight)
      .attr('y2', innerHeight)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#q175-axis-arrow)')

    chart
      .append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', innerHeight)
      .attr('y2', 0)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#q175-axis-arrow)')

    xTicks.forEach((tick) => {
      chart
        .append('text')
        .attr('x', x(tick))
        .attr('y', innerHeight + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .text(String(tick))
    })

    yTicks.forEach((tick) => {
      chart
        .append('text')
        .attr('x', -8)
        .attr('y', y(tick) + 4)
        .attr('text-anchor', 'end')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .text(String(tick))
    })

    chart
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.textColor)
      .attr('font-size', 14)
      .text(xLabel)

    if (points.length > 1) {
      const line = d3
        .line<LinePoint>()
        .x((d) => x(d.x))
        .y((d) => y(d.y))
        .curve(d3.curveMonotoneX)

      chart
        .append('path')
        .datum(points)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 3)
    }

    if (seriesLabel && points.length > 0) {
      const lastPoint = points[points.length - 1]
      chart
        .append('text')
        .attr('x', x(lastPoint.x) - 3)
        .attr('y', y(lastPoint.y) - 6)
        .attr('text-anchor', 'start')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text(seriesLabel)
    }
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
