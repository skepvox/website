import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type BarSeries = {
  id: string
  label: string
  values: number[]
  color?: string
}

type BarData = {
  categories?: string[]
  series?: BarSeries[]
  yMax?: number
  yTicks?: number
  yLabel?: string
  debug?: boolean
}

const DEFAULT_COLORS = ['#1fd5e5', '#f5a623', '#7a3df2']

const estimateLegendItemWidth = (label: string) => {
  return 10 + 6 + label.length * 7
}

export const renderQ162Bar = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as BarData
    const debug = payload.debug ?? meta.debug ?? false
    const categories = payload.categories || ['1ª série', '2ª série', '3ª série']
    const series =
      payload.series || [
        { id: 'futebol', label: 'Futebol', values: [70, 60, 50] },
        { id: 'volei', label: 'Vôlei', values: [30, 30, 40] },
        { id: 'basquete', label: 'Basquete', values: [10, 30, 40] }
      ]
    const yMax =
      payload.yMax ??
      d3.max(series.flatMap((item) => item.values)) ??
      0
    const yTicks = payload.yTicks ?? 8
    const yLabel = payload.yLabel || 'Quantidade de estudantes'

    const titleLines = (meta.title || '').split('\n').filter(Boolean)
    const titleLineHeight = 16
    const titleHeight = titleLines.length ? titleLines.length * titleLineHeight + 6 : 0

    const legendRowHeight = 16
    const legendGap = 10
    const legendOffset = 22
    const legendItemGap = 14
    const leftMargin = 40
    const rightMargin = 16

    const legendRows: Array<{ items: BarSeries[]; width: number }> = []
    let currentRow: BarSeries[] = []
    let currentWidth = 0
    const availableLegendWidth = width - leftMargin - rightMargin

    series.forEach((item) => {
      const itemWidth = estimateLegendItemWidth(item.label)
      const nextWidth = currentRow.length ? currentWidth + legendItemGap + itemWidth : itemWidth
      if (currentRow.length && nextWidth > availableLegendWidth) {
        legendRows.push({ items: currentRow, width: currentWidth })
        currentRow = [item]
        currentWidth = itemWidth
      } else {
        currentRow.push(item)
        currentWidth = nextWidth
      }
    })
    if (currentRow.length) {
      legendRows.push({ items: currentRow, width: currentWidth })
    }

    const legendBlockHeight =
      legendRows.length > 0 ? legendRows.length * legendRowHeight + legendGap : 0
    const margin = {
      top: 10 + titleHeight + 12,
      right: rightMargin,
      bottom: 24 + legendBlockHeight,
      left: leftMargin
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
          .attr('y', 12 + 14 + index * titleLineHeight)
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

    const x0 = d3
      .scaleBand()
      .domain(categories)
      .range([0, innerWidth])
      .padding(0.24)
    const x1 = d3
      .scaleBand()
      .domain(series.map((item) => item.id))
      .range([0, x0.bandwidth()])
      .padding(0.12)

    const y = d3.scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0])

    const grid = d3
      .axisLeft(y)
      .ticks(yTicks)
      .tickSize(-innerWidth)
      .tickFormat(() => '')

    chart
      .append('g')
      .call(grid)
      .selectAll('line')
      .attr('stroke', theme.gridColor)
      .attr('stroke-opacity', 0.7)

    chart.selectAll('g path').remove()

    chart
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight)
      .attr('y2', innerHeight)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.4)

    const xAxis = d3.axisBottom(x0).tickSize(0)
    const xAxisG = chart
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
    xAxisG
      .selectAll('text')
      .attr('fill', theme.textColor)
      .attr('font-size', 12)
      .attr('dy', null)
      .attr('transform', 'translate(0,12)')
    xAxisG.selectAll('path').attr('stroke', 'transparent')

    const groups = chart
      .selectAll('.bar-group')
      .data(categories)
      .enter()
      .append('g')
      .attr('transform', (category) => `translate(${x0(category)},0)`)

    series.forEach((item, seriesIndex) => {
      groups
        .append('rect')
        .attr('x', () => x1(item.id) || 0)
        .attr('y', (_category, index) => y(item.values[index]))
        .attr('width', x1.bandwidth())
        .attr('height', (_category, index) => innerHeight - y(item.values[index]))
        .attr('fill', item.color || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length])
    })

    chart
      .append('text')
      .attr('x', -innerHeight / 2)
      .attr('y', -18)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .attr('fill', theme.textColor)
      .attr('font-size', 12)
      .text(yLabel)

    const legendYOffset = margin.top + innerHeight + legendGap + legendOffset
    const legend = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${legendYOffset})`)
      .attr('font-size', 12)

    let offsetY = 0
    legendRows.forEach((row) => {
      let offsetX = Math.max(0, (innerWidth - row.width) / 2)
      row.items.forEach((item, index) => {
        const itemWidth = estimateLegendItemWidth(item.label)
        const group = legend.append('g').attr('transform', `translate(${offsetX},${offsetY})`)
        group
          .append('rect')
          .attr('x', 0)
          .attr('y', 2)
          .attr('width', 10)
          .attr('height', 10)
          .attr('rx', 2)
          .attr('fill', item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length])

        group
          .append('text')
          .attr('x', 16)
          .attr('y', 12)
          .attr('fill', theme.mutedTextColor)
          .text(item.label)

        offsetX += itemWidth + legendItemGap
      })
      offsetY += legendRowHeight
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
