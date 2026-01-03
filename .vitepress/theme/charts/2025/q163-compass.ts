import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type CompassData = {
  cardinals?: { label: string; degrees: number }[]
  ticks?: number[]
  highlightedDirections?: { degrees: number; color: string; label: string }[]
}

export const renderQ163Compass = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as CompassData
    const cardinals = payload.cardinals || [
      { label: 'N', degrees: 0 },
      { label: 'L', degrees: 90 },
      { label: 'S', degrees: 180 },
      { label: 'O', degrees: 270 }
    ]
    const baseTicks =
      payload.ticks || [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340]
    const ticks = Array.from(new Set([...baseTicks, 90, 270])).sort((a, b) => a - b)

    const size = Math.min(width, height)
    const scale = size / 200
    const cx = width / 2
    const cy = height / 2
    const outerRadius = size * 0.48
    const innerRadius = outerRadius * 0.68
    const ringWidth = outerRadius - innerRadius
    const majorTicks = [...ticks].sort((a, b) => a - b)
    const majorTickSet = new Set(majorTicks)
    const minorTicks: number[] = []

    for (let deg = 0; deg < 360; deg += 10) {
      if (!majorTickSet.has(deg)) {
        minorTicks.push(deg)
      }
    }

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Bússola')
      .style('font-family', theme.fontFamily)

    const group = svg.append('g').attr('transform', `translate(${cx}, ${cy})`)

    const toRadians = (deg: number) => ((deg - 90) * Math.PI) / 180
    const labelSize = Math.max(8, 10 * scale)
    const cardinalSize = Math.max(12, 15 * scale)

    const root = typeof document === 'undefined' ? null : document.documentElement
    const isDarkMode = Boolean(root?.classList.contains('dark'))
    const ringFill = isDarkMode ? '#1f1f1f' : '#e3e3e3'
    const innerFill = isDarkMode ? '#0f0f0f' : '#bfbfbf'

    // Outer circle (compass face)
    group
      .append('circle')
      .attr('r', outerRadius)
      .attr('fill', ringFill)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.6)

    // Inner circle
    group
      .append('circle')
      .attr('r', innerRadius)
      .attr('fill', innerFill)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1)

    const drawTick = (deg: number, length: number, widthValue: number) => {
      const angle = toRadians(deg)
      const tickStart = innerRadius * 0.98
      const tickEnd = tickStart - length
      const x1 = tickStart * Math.cos(angle)
      const y1 = tickStart * Math.sin(angle)
      const x2 = tickEnd * Math.cos(angle)
      const y2 = tickEnd * Math.sin(angle)

      group
        .append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', theme.textColor)
        .attr('stroke-width', widthValue)
    }

    // Minor ticks
    minorTicks.forEach((deg) => {
      drawTick(deg, 6 * scale, 1)
    })

    // Major ticks + labels
    majorTicks.forEach((deg) => {
      const isCardinal = deg % 90 === 0
      drawTick(deg, (isCardinal ? 14 : 10) * scale, isCardinal ? 1.6 : 1.2)
      const angle = toRadians(deg)
      const labelRadius = innerRadius + ringWidth * 0.5
      const lx = labelRadius * Math.cos(angle)
      const ly = labelRadius * Math.sin(angle)

      group
        .append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', labelSize)
        .text(deg.toString())
    })

    // Cardinal labels
    cardinals.forEach(({ label, degrees }) => {
      const angle = toRadians(degrees)
      const labelRadius = innerRadius * 0.65
      const isHorizontal = degrees % 180 === 90
      const yOffset = isHorizontal ? 2 * scale : 0
      const x = labelRadius * Math.cos(angle)
      const y = labelRadius * Math.sin(angle) + yOffset

      group
        .append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', cardinalSize)
        .attr('font-weight', 'bold')
        .text(label)
    })

    // Cross lines
    const crossRadius = innerRadius * 0.5
    group
      .append('line')
      .attr('x1', -crossRadius)
      .attr('y1', 0)
      .attr('x2', crossRadius)
      .attr('y2', 0)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1)

    group
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', crossRadius)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1)

    // North arrow (red)
    const arrowTip = innerRadius * 0.55
    const arrowTail = innerRadius * 0.02
    const arrowMid = innerRadius * 0.33
    const arrowHalfWidth = innerRadius * 0.075
    group
      .append('polygon')
      .attr(
        'points',
        `0,${-arrowTip} ${arrowHalfWidth},${-arrowMid} 0,${-arrowTail} ${-arrowHalfWidth},${-arrowMid}`
      )
      .attr('fill', '#e74c3c')

    // Center dot
    group
      .append('circle')
      .attr('r', Math.max(2.5, 3.5 * scale))
      .attr('fill', theme.textColor)

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
