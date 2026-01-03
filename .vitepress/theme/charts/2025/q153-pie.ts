import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type PieItem = {
  label: string
  value: number
  color?: string
}

type PieData = {
  items?: PieItem[]
  debug?: boolean
}

const DEFAULT_COLORS = ['#ff7a45', '#f5c542', '#7ccf4f', '#b9a7ff']

const estimateLegendItemWidth = (label: string) => {
  return 10 + 6 + label.length * 7
}

export const renderQ153Pie = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as PieData
    const debug = payload.debug ?? meta.debug ?? false
    const items =
      payload.items || [
        { label: 'Ingles', value: 60 },
        { label: 'Espanhol', value: 25 },
        { label: 'Frances', value: 10 },
        { label: 'Alemao', value: 5 }
      ]
    const sliceColors = items.map(
      (item, index) => item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    )

    const titleLines = (meta.title || '').split('\n').filter(Boolean)
    const titleLineHeight = 16
    const titleHeight = titleLines.length ? titleLines.length * titleLineHeight + 4 : 0
    const verticalOffset = 36
    const titleOffset = -20
    const titleGapAdjust = 16

    const legendRowHeight = 16
    const legendGap = 10
    const legendItemGap = 12
    const availableLegendWidth = width - 32
    const legendRows: Array<{ items: PieItem[]; width: number }> = []
    let currentRow: PieItem[] = []
    let currentWidth = 0

    items.forEach((item) => {
      const itemWidth = estimateLegendItemWidth(item.label)
      const nextWidth = currentRow.length ? currentWidth + legendItemGap + itemWidth : currentWidth + itemWidth
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
      top: Math.max(0, 10 + titleHeight + verticalOffset - titleGapAdjust),
      right: 16,
      bottom: Math.max(0, 12 + legendBlockHeight - 15),
      left: 16
    }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    if (innerWidth <= 0 || innerHeight <= 0) {
      return
    }

    const radius = Math.min(innerWidth, innerHeight) / 2
    const centerX = margin.left + innerWidth / 2
    const centerY = margin.top + innerHeight / 2

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Grafico de setores')
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
      .attr('transform', `translate(${centerX},${centerY})`)

    if (debug) {
      chart
        .append('rect')
        .attr('x', -innerWidth / 2)
        .attr('y', -innerHeight / 2)
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'rgba(0, 128, 255, 0.05)')
        .attr('stroke', 'rgba(0, 128, 255, 0.3)')
    }

    const pie = d3.pie<PieItem>().sort(null).value((d) => d.value)
    const arc = d3
      .arc<d3.PieArcDatum<PieItem>>()
      .innerRadius(0)
      .outerRadius(radius)
    const labelArc = d3
      .arc<d3.PieArcDatum<PieItem>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6)

    const arcs = pie(items)

    chart
      .selectAll('path')
      .data(arcs)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (_, index) => sliceColors[index])
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)

    chart
      .selectAll('text')
      .data(arcs)
      .enter()
      .append('text')
      .attr('transform', (d) => {
        const isTinySlice = d.data.value <= 5
        const isSmallSlice = d.data.value <= 10
        const labelRadius = isTinySlice
          ? radius * 0.82
          : isSmallSlice
            ? radius * 0.78
            : radius * 0.6
        const customArc = d3
          .arc<d3.PieArcDatum<PieItem>>()
          .innerRadius(labelRadius)
          .outerRadius(labelRadius)
        return `translate(${customArc.centroid(d)})`
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#1b1b1b')
      .attr('font-size', 12)
      .text((d) => `${d.data.value}%`)

    const legendYOffset = margin.top + innerHeight + legendGap
    const legend = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${legendYOffset})`)
      .attr('font-size', 12)

    let offsetY = 0
    legendRows.forEach((row) => {
      let offsetX = Math.max(0, (innerWidth - row.width) / 2)
      row.items.forEach((item, index) => {
        const itemWidth = estimateLegendItemWidth(item.label)
        const group = legend
          .append('g')
          .attr('transform', `translate(${offsetX},${offsetY})`)
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
