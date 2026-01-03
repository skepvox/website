import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type BarItem = {
  label: string
  value: number
  color?: string
}

type BarData = {
  items?: BarItem[]
  debug?: boolean
}

const DEFAULT_COLORS = ['#ff7a45', '#f5c542', '#7ccf4f', '#b9a7ff']

const roundedTopRectPath = (
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  if (width <= 0 || height <= 0) {
    return ''
  }
  const r = Math.max(0, Math.min(radius, width / 2, height))
  const right = x + width
  const bottom = y + height
  if (r === 0) {
    return `M${x},${y}H${right}V${bottom}H${x}Z`
  }
  return [
    `M${x},${bottom}`,
    `V${y + r}`,
    `A${r},${r} 0 0 1 ${x + r},${y}`,
    `H${right - r}`,
    `A${r},${r} 0 0 1 ${right},${y + r}`,
    `V${bottom}`,
    'Z'
  ].join(' ')
}

export const renderQ153Bar = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as BarData
    const debug = payload.debug ?? meta.debug ?? false
    const items =
      payload.items || [
        { label: 'Ingles', value: 280 },
        { label: 'Espanhol', value: 80 },
        { label: 'Frances', value: 20 },
        { label: 'Alemao', value: 20 }
      ]

    const titleLines = (meta.title || '').split('\n').filter(Boolean)
    const titleLineHeight = 16
    const titleHeight = titleLines.length ? titleLines.length * titleLineHeight + 4 : 0
    const verticalOffset = 32
    const titleOffset = -20
    const titleGapAdjust = 16

    const margin = {
      top: Math.max(0, 10 + titleHeight + verticalOffset - titleGapAdjust),
      right: 16,
      bottom: 31,
      left: 16
    }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    if (innerWidth <= 0 || innerHeight <= 0) {
      return
    }

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Grafico de barras')
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

    if (titleLines.length > 0) {
      titleLines.forEach((line, index) => {
        svg
          .append('text')
          .attr('x', width / 2)
          .attr('y', 12 + verticalOffset + titleOffset + index * titleLineHeight)
          .attr('text-anchor', 'middle')
          .attr('fill', theme.textColor)
          .attr('font-size', 13)
          .attr('font-weight', 600)
          .text(line)
      })
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

    const x = d3
      .scaleBand()
      .domain(items.map((item) => item.label))
      .range([0, innerWidth])
      .padding(0.45)

    const maxValue = d3.max(items, (item) => item.value) || 0
    const y = d3.scaleLinear().domain([0, maxValue]).range([innerHeight, 0]).nice()

    chart
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight)
      .attr('y2', innerHeight)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 2)

    const barRadius = 6
    chart
      .selectAll('path')
      .data(items)
      .enter()
      .append('path')
      .attr('d', (item) => {
        const xPos = x(item.label) || 0
        const yPos = y(item.value)
        const height = innerHeight - yPos
        return roundedTopRectPath(xPos, yPos, x.bandwidth(), height, barRadius)
      })
      .attr('fill', (item, index) => item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length])

    chart
      .selectAll('.bar-value')
      .data(items)
      .enter()
      .append('text')
      .attr('class', 'bar-value')
      .attr('x', (item) => (x(item.label) || 0) + x.bandwidth() / 2)
      .attr('y', (item) => y(item.value) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.textColor)
      .attr('font-size', 12)
      .text((item) => String(item.value))

    chart
      .selectAll('.bar-label')
      .data(items)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (item) => (x(item.label) || 0) + x.bandwidth() / 2)
      .attr('y', innerHeight + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.textColor)
      .attr('font-size', 12)
      .text((item) => item.label)
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
