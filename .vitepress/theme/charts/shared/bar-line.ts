import * as d3 from 'd3'
import type { BarLineMeta, ChartInstance, ChartRenderInput, ChartSeries } from '../types'

const DEFAULT_COLORS = ['#f06464', '#3aa35c', '#4fc3f7']

const getSeriesColor = (series: ChartSeries, index: number) => {
  return series.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
}

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

export const renderBarLineChart = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, theme, width, height } = state
    const meta = state.meta as BarLineMeta
    const debug = meta.debug ?? false
    const container = d3.select(el)
    container.selectAll('*').remove()

    const axisArea = 36
    const legendRowHeight = 18
    const legendIconWidth = 18
    const legendTextGap = 6
    const legendItemGap = 16
    const legendSpacing = 12
    const titleHeight = meta.title ? 28 : 0
    const baseMargin = { top: 16, right: 24, bottom: axisArea, left: 48 }
    const availableLegendWidth = width - baseMargin.left - baseMargin.right

    const estimateLegendItemWidth = (label: string) =>
      legendIconWidth + legendTextGap + label.length * 7 + legendItemGap

    let legendRows = 0
    let legendX = 0
    if (meta.series.length > 0) {
      legendRows = 1
      meta.series.forEach((series) => {
        const itemWidth = estimateLegendItemWidth(series.label)
        if (legendX > 0 && legendX + itemWidth > availableLegendWidth) {
          legendRows += 1
          legendX = 0
        }
        legendX += itemWidth
      })
    }

    const legendBlockHeight = legendRows > 0 ? legendRows * legendRowHeight + legendSpacing : 0
    const margin = {
      ...baseMargin,
      top: baseMargin.top + titleHeight,
      bottom: baseMargin.bottom + legendBlockHeight
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
      .attr('aria-label', meta.title || 'Grafico')
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

    if (meta.title) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', baseMargin.top + 12)
        .attr('text-anchor', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', 14)
        .attr('font-weight', 600)
        .text(meta.title)
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

    const categories = data.map((row) => String(row[meta.categoryField]))
    const barSeries = meta.series.filter((series) => series.kind === 'bar')
    const lineSeries = meta.series.filter((series) => series.kind === 'line')

    const x0 = d3.scaleBand().domain(categories).range([0, innerWidth]).padding(0.2)
    const x1 = d3
      .scaleBand()
      .domain(barSeries.map((series) => series.id))
      .range([0, x0.bandwidth()])
      .padding(0.12)

    const maxValue =
      d3.max(data, (row) =>
        d3.max(meta.series, (series) => Number(row[series.field]) || 0)
      ) || 0
    const yMax = meta.yAxis?.max ?? maxValue
    const yMin = meta.yAxis?.min ?? 0

    const y = d3.scaleLinear().domain([yMin, yMax]).nice().range([innerHeight, 0])

    const yGrid = d3
      .axisLeft(y)
      .ticks(meta.yAxis?.ticks ?? 6)
      .tickSize(-innerWidth)
      .tickFormat(() => '')

    chart
      .append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', theme.gridColor)
      .attr('stroke-opacity', 0.6)

    chart.selectAll('.grid path').remove()

    const yAxis = d3
      .axisLeft(y)
      .ticks(meta.yAxis?.ticks ?? 6)
      .tickSizeOuter(0)

    const yAxisG = chart.append('g').call(yAxis)
    yAxisG.selectAll('path').attr('stroke', theme.axisColor)
    yAxisG.selectAll('line').attr('stroke', theme.axisColor)
    yAxisG
      .selectAll('text')
      .attr('fill', theme.mutedTextColor)
      .attr('font-size', 12)

    const xAxis = d3.axisBottom(x0).tickSizeOuter(0)
    const xAxisG = chart
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
    xAxisG.selectAll('path').attr('stroke', theme.axisColor)
    xAxisG.selectAll('line').attr('stroke', theme.axisColor)
    xAxisG
      .selectAll('text')
      .attr('fill', theme.mutedTextColor)
      .attr('font-size', 12)

    const barGroups = chart
      .selectAll('.bar-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('transform', (row) => `translate(${x0(String(row[meta.categoryField]))},0)`)

    barSeries.forEach((series, seriesIndex) => {
      const barRadius = 6
      barGroups
        .append('path')
        .attr('d', (row) => {
          const value = Number(row[series.field]) || 0
          const x = x1(series.id) || 0
          const yPos = y(value)
          const height = innerHeight - yPos
          return roundedTopRectPath(x, yPos, x1.bandwidth(), height, barRadius)
        })
        .attr('fill', getSeriesColor(series, seriesIndex))
    })

    lineSeries.forEach((series, seriesIndex) => {
      const line = d3
        .line<d3.DSVRowString<string> | Record<string, unknown>>()
        .x((row) => (x0(String((row as Record<string, unknown>)[meta.categoryField])) || 0) + x0.bandwidth() / 2)
        .y((row) => y(Number((row as Record<string, unknown>)[series.field]) || 0))
        .curve(d3.curveLinear)

      chart
        .append('path')
        .datum(data as Array<Record<string, unknown>>)
        .attr('fill', 'none')
        .attr('stroke', getSeriesColor(series, barSeries.length + seriesIndex))
        .attr('stroke-width', 2.5)
        .attr('d', line as never)

      chart
        .selectAll(`.dot-${series.id}`)
        .data(data)
        .enter()
        .append('circle')
        .attr('class', `dot-${series.id}`)
        .attr(
          'cx',
          (row) => (x0(String(row[meta.categoryField])) || 0) + x0.bandwidth() / 2
        )
        .attr('cy', (row) => y(Number(row[series.field]) || 0))
        .attr('r', 4)
        .attr('fill', getSeriesColor(series, barSeries.length + seriesIndex))
        .attr('stroke', theme.gridColor)
        .attr('stroke-width', 1)
    })

    const legendYOffset =
      margin.top + innerHeight + axisArea + (legendRows > 0 ? legendSpacing : 0)
    const legend = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${legendYOffset})`)
      .attr('font-size', 12)

    const rowWidths: number[] = []
    let rowWidth = 0
    meta.series.forEach((series) => {
      const itemWidth = estimateLegendItemWidth(series.label)
      if (rowWidth > 0 && rowWidth + itemWidth > availableLegendWidth) {
        rowWidths.push(rowWidth)
        rowWidth = 0
      }
      rowWidth += itemWidth
    })
    if (rowWidth > 0) {
      rowWidths.push(rowWidth)
    }

    let offsetX = rowWidths.length > 0 ? Math.max(0, (availableLegendWidth - rowWidths[0]) / 2) : 0
    let offsetY = 0
    let rowIndex = 0
    meta.series.forEach((series, index) => {
      const itemWidth = estimateLegendItemWidth(series.label)
      if (offsetX > 0 && offsetX + itemWidth > availableLegendWidth) {
        rowIndex += 1
        offsetX =
          rowWidths[rowIndex] !== undefined
            ? Math.max(0, (availableLegendWidth - rowWidths[rowIndex]) / 2)
            : 0
        offsetY += legendRowHeight
      }

      const item = legend
        .append('g')
        .attr('transform', `translate(${offsetX},${offsetY})`)
      if (series.kind === 'line') {
        item
          .append('line')
          .attr('x1', 0)
          .attr('x2', legendIconWidth)
          .attr('y1', 6)
          .attr('y2', 6)
          .attr('stroke', getSeriesColor(series, barSeries.length + index))
          .attr('stroke-width', 2.5)
      } else {
        item
          .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 12)
          .attr('height', 12)
          .attr('rx', 2)
          .attr('fill', getSeriesColor(series, index))
      }

      item
        .append('text')
        .attr('x', legendIconWidth + legendTextGap)
        .attr('y', 10)
        .attr('fill', theme.mutedTextColor)
        .text(series.label)

      offsetX += itemWidth
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
