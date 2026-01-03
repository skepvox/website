import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type AsymptoteData = {
  x: number
  labelNum?: string
  labelDen?: string
}

type TangentData = {
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
  k?: number
  a?: number
  p?: number
  m?: number
  asymptotes?: AsymptoteData[]
  xTicks?: number[]
  yTicks?: number[]
  xLabel?: string
  yLabel?: string
  curveColor?: string
  showVessel?: boolean
  debug?: boolean
}

export const renderQ164Tangent = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as TangentData
    const debug = payload.debug ?? meta.debug ?? false

    const xMin = payload.xMin ?? -1.5
    const xMax = payload.xMax ?? 6
    const yMin = payload.yMin ?? -10
    const yMax = payload.yMax ?? 55

    const k = payload.k ?? 30
    const a = payload.a ?? 10
    const p = payload.p ?? 0.5
    const m = payload.m ?? -2.5

    const asymptotes = payload.asymptotes || []
    const xTicks = payload.xTicks || [0, 2.5, 4]
    const yTicks = payload.yTicks || [30]
    const xLabel = payload.xLabel || 'T'
    const yLabel = payload.yLabel || 'D'
    const curveColor = payload.curveColor || '#8b1a1a'
    const showVessel = payload.showVessel ?? true

    const margin = { top: 20, right: 30, bottom: 55, left: 100 }
    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = Math.max(0, height - margin.top - margin.bottom)

    if (innerWidth === 0 || innerHeight === 0) return

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Gráfico da função tangente')
      .style('font-family', theme.fontFamily)

    if (debug) {
      svg.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', width).attr('height', height)
        .attr('fill', 'rgba(255, 0, 0, 0.06)')
        .attr('stroke', 'rgba(255, 0, 0, 0.3)')
    }

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, innerWidth])
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0])

    // Draw vessel illustration on the left
    // Position vessel so top aligns with T=4, bottom aligns with T=0
    const yAt4 = k + a * Math.tan(p * (4 + m))
    const yAt0 = k + a * Math.tan(p * (0 + m))
    const vesselTopY = margin.top + yScale(yAt4)
    const vesselBottomY = margin.top + yScale(yAt0)
    const vesselHeight = vesselBottomY - vesselTopY
    if (showVessel) {
      const vesselOffsetX = -50
      const topWidth = 26
      const bulgeWidth = 28
      const neckWidth = 8
      const baseWidth = 18
      const vesselG = svg.append('g')
        .attr('transform', `translate(${margin.left + vesselOffsetX}, ${vesselTopY})`)

      // Container shape (hourglass/goblet) - scaled to fit between T=4 and the table top
      const h = vesselHeight
      const vesselPath = `
        M ${-topWidth} 0
        L ${topWidth} 0
        C ${topWidth} ${h * 0.06} ${bulgeWidth} ${h * 0.14} ${bulgeWidth} ${h * 0.24}
        C ${bulgeWidth} ${h * 0.36} ${neckWidth} ${h * 0.48} ${neckWidth} ${h * 0.6}
        C ${neckWidth} ${h * 0.72} ${baseWidth} ${h * 0.82} ${baseWidth} ${h * 0.92}
        L ${baseWidth} ${h}
        L ${-baseWidth} ${h}
        L ${-baseWidth} ${h * 0.92}
        C ${-baseWidth} ${h * 0.82} ${-neckWidth} ${h * 0.72} ${-neckWidth} ${h * 0.6}
        C ${-neckWidth} ${h * 0.48} ${-bulgeWidth} ${h * 0.36} ${-bulgeWidth} ${h * 0.24}
        C ${-bulgeWidth} ${h * 0.14} ${-topWidth} ${h * 0.06} ${-topWidth} 0
        Z
      `
      vesselG.append('path')
        .attr('d', vesselPath)
        .attr('fill', 'none')
        .attr('stroke', '#6f6f6f')
        .attr('stroke-width', 1.5)

      // Table top (trapezoid)
      const baseHeight = 12
      const baseTopWidth = 34
      const baseBottomWidth = 52
      vesselG.append('polygon')
        .attr('points', [
          [-baseTopWidth / 2, h],
          [baseTopWidth / 2, h],
          [baseBottomWidth / 2, h + baseHeight],
          [-baseBottomWidth / 2, h + baseHeight]
        ].map((point) => point.join(',')).join(' '))
        .attr('fill', '#5f5f5f')

      // "Tampo da mesa" label
      const labelWidth = 88
      const labelHeight = 18
      vesselG.append('rect')
        .attr('x', -labelWidth - 4)
        .attr('y', h + 7)
        .attr('width', labelWidth)
        .attr('height', labelHeight)
        .attr('fill', '#8a5a12')
        .attr('stroke', '#4f3a16')
        .attr('stroke-width', 0.8)

      vesselG.append('text')
        .attr('x', -labelWidth / 2 - 4)
        .attr('y', h + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fdf6e3')
        .attr('font-size', 10)
        .text('Tampo da mesa')

      const vesselRightTopX = vesselOffsetX + topWidth
      const vesselRightBaseX = vesselOffsetX + baseWidth
      chart
        .append('line')
        .attr('x1', xScale(4))
        .attr('x2', vesselRightTopX)
        .attr('y1', yScale(yAt4))
        .attr('y2', yScale(yAt4))
        .attr('stroke', '#00bcd4')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '6,4')
        .attr('opacity', 0.8)

      chart
        .append('line')
        .attr('x1', xScale(0))
        .attr('x2', vesselRightBaseX)
        .attr('y1', yScale(yAt0))
        .attr('y2', yScale(yAt0))
        .attr('stroke', '#00bcd4')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '6,4')
        .attr('opacity', 0.8)
    }

    const defs = svg.append('defs')
    defs.append('marker')
      .attr('id', 'q164-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 7)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L8,0L0,3Z')
      .attr('fill', theme.textColor)

    defs.append('marker')
      .attr('id', 'q164-label-arrow')
      .attr('viewBox', '0 -3 6 6')
      .attr('refX', 5.5)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L6,0L0,3Z')
      .attr('fill', theme.textColor)

    // X axis
    chart.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#q164-arrow)')

    // Y axis
    chart.append('line')
      .attr('x1', xScale(0))
      .attr('x2', xScale(0))
      .attr('y1', innerHeight)
      .attr('y2', 0)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#q164-arrow)')

    // Axis labels
    chart.append('text')
      .attr('x', innerWidth + 10)
      .attr('y', yScale(0) + 5)
      .attr('text-anchor', 'start')
      .attr('fill', theme.textColor)
      .attr('font-size', 14)
      .attr('font-style', 'italic')
      .text(xLabel)

    chart.append('text')
      .attr('x', xScale(0) + 8)
      .attr('y', -8)
      .attr('text-anchor', 'start')
      .attr('fill', theme.textColor)
      .attr('font-size', 14)
      .attr('font-style', 'italic')
      .text(yLabel)

    // X ticks
    xTicks.forEach(tick => {
      if (tick === 0) return
      const x = xScale(tick)
      chart.append('line')
        .attr('x1', x).attr('x2', x)
        .attr('y1', yScale(0) - 4).attr('y2', yScale(0) + 4)
        .attr('stroke', theme.textColor)
        .attr('stroke-width', 1)

      chart.append('text')
        .attr('x', x)
        .attr('y', yScale(0) + 18)
        .attr('text-anchor', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .text(tick === 2.5 ? '2,5' : tick.toString())
    })

    // Y ticks
    yTicks.forEach(tick => {
      const y = yScale(tick)
      chart.append('line')
        .attr('x1', xScale(0) - 4).attr('x2', xScale(0) + 4)
        .attr('y1', y).attr('y2', y)
        .attr('stroke', theme.textColor)
        .attr('stroke-width', 1)

      chart.append('text')
        .attr('x', xScale(0) - 10)
        .attr('y', y + 4)
        .attr('text-anchor', 'end')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .text(tick.toString())
    })

    // Origin
    chart.append('text')
      .attr('x', xScale(0) + 6)
      .attr('y', yScale(0) + 18)
      .attr('text-anchor', 'start')
      .attr('fill', theme.textColor)
      .attr('font-size', 12)
      .text('0')

    // Asymptotes (green dashed)
    const asymptoteXs = asymptotes.map(a => a.x).sort((a, b) => a - b)
    asymptotes.forEach(asym => {
      const x = xScale(asym.x)
      chart.append('line')
        .attr('x1', x).attr('x2', x)
        .attr('y1', 0).attr('y2', innerHeight)
        .attr('stroke', '#50d24c')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '2,3')
        .attr('opacity', 0.9)

      // Fraction label below x-axis
      if (asym.labelNum && asym.labelDen) {
        const labelOffset = asym.x < 0 ? -36 : 36
        const labelY = yScale(0) + 40
        const labelG = chart.append('g')
          .attr('transform', `translate(${x + labelOffset}, ${labelY})`)

        labelG.append('text')
          .attr('x', 0).attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('fill', theme.textColor)
          .attr('font-size', 11)
          .text(asym.labelNum)

        labelG.append('line')
          .attr('x1', -22).attr('x2', 22)
          .attr('y1', 5).attr('y2', 5)
          .attr('stroke', theme.textColor)
          .attr('stroke-width', 1)

        labelG.append('text')
          .attr('x', 0).attr('y', 18)
          .attr('text-anchor', 'middle')
          .attr('fill', theme.textColor)
          .attr('font-size', 11)
          .text(asym.labelDen)

        const arrowStartX = x + labelOffset + (asym.x < 0 ? 10 : -10)
        const arrowStartY = labelY - 6
        chart.append('line')
          .attr('x1', arrowStartX)
          .attr('y1', arrowStartY)
          .attr('x2', x)
          .attr('y2', yScale(0))
          .attr('stroke', theme.textColor)
          .attr('stroke-width', 1)
          .attr('marker-end', 'url(#q164-label-arrow)')
      }

      chart.append('circle')
        .attr('cx', x)
        .attr('cy', yScale(0))
        .attr('r', 3)
        .attr('fill', theme.textColor)
    })

    // Tangent function: D = k + a * tan(p * (T + m))
    const tanFunc = (t: number) => k + a * Math.tan(p * (t + m))

    // Helper lines
    // At T=2.5 (horizontal to y=30, vertical to x-axis)
    const yAt25 = tanFunc(2.5)
    chart.append('line')
      .attr('x1', xScale(0)).attr('x2', xScale(2.5))
      .attr('y1', yScale(yAt25)).attr('y2', yScale(yAt25))
      .attr('stroke', theme.mutedTextColor)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.7)

    chart.append('line')
      .attr('x1', xScale(2.5)).attr('x2', xScale(2.5))
      .attr('y1', yScale(0)).attr('y2', yScale(yAt25))
      .attr('stroke', theme.mutedTextColor)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.7)

    // At T=4 (vertical to curve)
    const yValAt4 = tanFunc(4)
    if (yValAt4 >= yMin && yValAt4 <= yMax) {
      chart.append('line')
        .attr('x1', xScale(4)).attr('x2', xScale(4))
        .attr('y1', yScale(0)).attr('y2', yScale(yValAt4))
        .attr('stroke', theme.mutedTextColor)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.7)
    }

    // Draw tangent curve
    if (asymptoteXs.length >= 2) {
      const leftA = asymptoteXs[0]
      const rightA = asymptoteXs[1]
      const buffer = 0.05
      const step = 0.02

      const line = d3.line<[number, number]>()
        .x((d: [number, number]) => d[0])
        .y((d: [number, number]) => d[1])
        .curve(d3.curveMonotoneX)

      // DASHED curve from left asymptote to T=0
      const dashedLeftPoints: [number, number][] = []
      for (let t = leftA + buffer; t <= 0; t += step) {
        const y = tanFunc(t)
        if (y >= yMin && y <= yMax) {
          dashedLeftPoints.push([xScale(t), yScale(y)])
        }
      }

      if (dashedLeftPoints.length > 1) {
        chart.append('path')
          .datum(dashedLeftPoints)
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', curveColor)
          .attr('stroke-width', 2.5)
          .attr('stroke-dasharray', '5,4')
      }

      // SOLID curve from T=0 to T=4
      const solidPoints: [number, number][] = []
      for (let t = 0; t <= 4; t += step) {
        const y = tanFunc(t)
        if (y >= yMin && y <= yMax) {
          solidPoints.push([xScale(t), yScale(y)])
        }
      }

      if (solidPoints.length > 1) {
        chart.append('path')
          .datum(solidPoints)
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', curveColor)
          .attr('stroke-width', 2.5)
      }

      // DASHED curve from T=4 to right asymptote
      const dashedRightPoints: [number, number][] = []
      for (let t = 4; t <= rightA - buffer; t += step) {
        const y = tanFunc(t)
        if (y >= yMin && y <= yMax) {
          dashedRightPoints.push([xScale(t), yScale(y)])
        }
      }

      if (dashedRightPoints.length > 1) {
        chart.append('path')
          .datum(dashedRightPoints)
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', curveColor)
          .attr('stroke-width', 2.5)
          .attr('stroke-dasharray', '5,4')
      }
    }

    // Filled dots at key points (T=0, 2.5, 4)
    const filledPoints = [2.5]
    filledPoints.forEach(t => {
      const y = tanFunc(t)
      if (y >= yMin && y <= yMax) {
        chart.append('circle')
          .attr('cx', xScale(t))
          .attr('cy', yScale(y))
          .attr('r', 4)
          .attr('fill', theme.textColor)
      }
    })

    const openPoints = [0, 4]
    openPoints.forEach(t => {
      const y = tanFunc(t)
      if (y >= yMin && y <= yMax) {
        chart.append('circle')
          .attr('cx', xScale(t))
          .attr('cy', yScale(y))
          .attr('r', 4)
          .attr('fill', 'none')
          .attr('stroke', curveColor)
          .attr('stroke-width', 2)
      }
    })

    // Cyan dashed lines connecting curve points to vessel handled in vessel block
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
