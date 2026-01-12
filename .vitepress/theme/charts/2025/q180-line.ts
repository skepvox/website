import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type LinePoint = {
  value: number
  label?: string
  labelDx?: number
  labelDy?: number
  labelAnchor?: 'start' | 'middle' | 'end'
}

type LineData = {
  categories?: string[]
  points?: LinePoint[]
  yTicks?: number[]
  yLabel?: string
  xLabel?: string
  lineColor?: string
  markerSize?: number
  labelFontSize?: number
  labelOffset?: number
  labelOffsetBelow?: number
}

const DEFAULT_LINE_COLOR = '#00c9e8'
const DEFAULT_MARKER_SIZE = 8
const DEFAULT_LABEL_SIZE = 12

const formatNumber = (value: number) => {
  return String(value).replace('.', ',')
}

export const renderQ180Line = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as LineData
    const categories =
      payload.categories || ['11-12', '12-13', '13-14', '14-15', '15-16']
    const points = payload.points || []
    const yTicks = payload.yTicks || []
    const yLabel = payload.yLabel || ''
    const xLabel = payload.xLabel || ''
    const lineColor = payload.lineColor || DEFAULT_LINE_COLOR
    const markerSize = payload.markerSize || DEFAULT_MARKER_SIZE
    const labelFontSize = payload.labelFontSize || DEFAULT_LABEL_SIZE

    const minTick = Math.min(...yTicks, ...points.map((point) => point.value))
    const maxTick = Math.max(...yTicks, ...points.map((point) => point.value))

    const margin = { top: 18, right: 18, bottom: 36, left: 54 }
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
      .attr('aria-label', meta.title || 'Grafico de producao')
      .style('font-family', theme.fontFamily)

    const chart = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3
      .scaleBand<string>()
      .domain(categories)
      .range([0, innerWidth])
      .paddingInner(0.2)
      .paddingOuter(0.3)

    const getX = (label: string) => {
      const band = x(label)
      if (band === undefined) {
        return undefined
      }
      return band + x.bandwidth() / 2
    }

    const y = d3
      .scaleLinear()
      .domain([minTick, maxTick])
      .range([innerHeight, 0])

    yTicks.forEach((tick) => {
      if (tick === minTick) {
        return
      }
      chart
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', y(tick))
        .attr('y2', y(tick))
        .attr('stroke', theme.gridColor)
        .attr('stroke-width', 1)
    })

    chart
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight)
      .attr('y2', innerHeight)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.5)

    yTicks.forEach((tick) => {
      chart
        .append('text')
        .attr('x', -8)
        .attr('y', y(tick) + 4)
        .attr('text-anchor', 'end')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .text(formatNumber(tick))
    })

    categories.forEach((label) => {
      const xPos = getX(label)
      if (xPos === undefined) {
        return
      }
      chart
        .append('text')
        .attr('x', xPos)
        .attr('y', innerHeight + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .text(label)
    })

    if (yLabel) {
      chart
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 16)
        .attr('text-anchor', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .text(yLabel)
    }

    if (xLabel) {
      chart
        .append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 34)
        .attr('text-anchor', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .text(xLabel)
    }

    if (points.length > 1) {
      const line = d3
        .line<LinePoint>()
        .x((d, index) => getX(categories[index]) || 0)
        .y((d) => y(d.value))
        .curve(d3.curveLinear)

      chart
        .append('path')
        .datum(points)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 2.5)
    }

    const labelOffset = payload.labelOffset ?? 10
    const labelOffsetBelow = payload.labelOffsetBelow ?? labelOffset + 8

    points.forEach((point, index) => {
      const xPos = getX(categories[index])
      if (xPos === undefined) {
        return
      }
      const yPos = y(point.value)

      chart
        .append('rect')
        .attr('x', xPos - markerSize / 2)
        .attr('y', yPos - markerSize / 2)
        .attr('width', markerSize)
        .attr('height', markerSize)
        .attr('fill', lineColor)

      const label = point.label || formatNumber(point.value)
      const labelDx = 0
      const labelDySign = point.labelDy ?? -1
      const labelDy = labelDySign >= 0 ? labelOffsetBelow : -labelOffset
      const anchor = 'middle'

      chart
        .append('text')
        .attr('x', xPos + labelDx)
        .attr('y', yPos + labelDy)
        .attr('text-anchor', anchor)
        .attr('fill', theme.textColor)
        .attr('font-size', labelFontSize)
        .text(label)
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
