import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type Point = { x: number; y: number }
type Segment = {
  from: string
  to: string
  direction: number
  duration?: string
  style: 'solid' | 'dashed' | 'dotted'
  color: string
}
type Route = {
  id: string
  label: string
  segments: Segment[]
}
type RoutesData = {
  points: Record<string, Point>
  routes: Route[]
}

export const renderQ163Routes = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as RoutesData
    const points = payload.points || {}
    const routes = payload.routes || []

    // Scale points to fit the SVG
    const allX = Object.values(points).map((p) => p.x)
    const allY = Object.values(points).map((p) => p.y)
    const minX = Math.min(...allX)
    const maxX = Math.max(...allX)
    const minY = Math.min(...allY)
    const maxY = Math.max(...allY)

    const size = Math.min(width, height)
    if (size <= 0) {
      return
    }
    const offsetX = (width - size) / 2
    const offsetY = (height - size) / 2
    const padding = Math.max(16, size * 0.1)
    const spanX = maxX - minX || 1
    const spanY = maxY - minY || 1
    const usableSize = Math.max(1, size - padding * 2)
    const scale = Math.min(usableSize / spanX, usableSize / spanY)
    const plotWidth = spanX * scale
    const plotHeight = spanY * scale
    const plotOffsetX = (size - plotWidth) / 2
    const plotOffsetY = (size - plotHeight) / 2
    const scaleX = (value: number) => plotOffsetX + (value - minX) * scale
    const scaleY = (value: number) => plotOffsetY + (value - minY) * scale

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Rotas de navegação')
      .style('font-family', theme.fontFamily)

    const lineWidth = Math.max(1.3, size * 0.01)
    const pointRadius = Math.max(3, size * 0.02)
    const labelFontSize = Math.max(12, size * 0.07)
    const labelOffset = Math.max(pointRadius + labelFontSize * 0.25, size * 0.03)
    const labelSideShift = labelOffset * 0.55
    const pointFill = theme.textColor

    const defs = svg.append('defs')
    const markerSize = Math.max(4, size * 0.026)
    const markerScale = (markerSize * lineWidth) / 10
    const markerRefX = 10 + pointRadius / markerScale
    const arrowHalfHeight = Math.max(3, size * 0.02)

    // Arrow markers for each route color
    const colors = new Set<string>()
    routes.forEach((route) => {
      route.segments.forEach((seg) => colors.add(seg.color))
    })

    colors.forEach((color) => {
      const markerId = `arrow-${color.replace('#', '')}`
      defs
        .append('marker')
        .attr('id', markerId)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', markerRefX)
        .attr('refY', 0)
        .attr('markerWidth', markerSize)
        .attr('markerHeight', markerSize)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', `M0,${-arrowHalfHeight}L10,0L0,${arrowHalfHeight}Z`)
        .attr('fill', color)
    })

    const group = svg.append('g').attr('transform', `translate(${offsetX}, ${offsetY})`)

    // Draw routes
    routes.forEach((route) => {
      route.segments.forEach((seg) => {
        const fromPt = points[seg.from]
        const toPt = points[seg.to]
        if (!fromPt || !toPt) return

        const x1 = scaleX(fromPt.x)
        const y1 = scaleY(fromPt.y)
        const x2 = scaleX(toPt.x)
        const y2 = scaleY(toPt.y)

        const line = group
          .append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', seg.color)
          .attr('stroke-width', lineWidth)

        if (seg.style !== 'dotted') {
          line.attr('marker-end', `url(#arrow-${seg.color.replace('#', '')})`)
        }

        if (seg.style === 'dashed') {
          line.attr('stroke-dasharray', `${Math.max(6, size * 0.04)},${Math.max(3, size * 0.02)}`)
        } else if (seg.style === 'dotted') {
          line.attr('stroke-dasharray', `${Math.max(3, size * 0.02)},${Math.max(4, size * 0.03)}`)
        }

        // Duration label at midpoint
        if (seg.duration && seg.duration !== '?') {
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2
          group
            .append('text')
            .attr('x', mx)
            .attr('y', my - 8)
            .attr('text-anchor', 'middle')
            .attr('fill', seg.color)
            .attr('font-size', Math.max(9, size * 0.045))
            .attr('font-weight', 600)
            .text(seg.duration)
        }
      })
    })

    const labelOverrides: Record<
      string,
      { dx: number; dy: number; anchor: 'start' | 'middle' | 'end'; baseline?: 'middle' | 'alphabetic' }
    > = {
      S: { dx: -labelSideShift, dy: -labelOffset - 2, anchor: 'end', baseline: 'alphabetic' },
      T: { dx: 0, dy: -labelOffset - 2, anchor: 'middle', baseline: 'alphabetic' },
      P: { dx: -labelSideShift - 2, dy: labelOffset, anchor: 'end' },
      Q: { dx: 0, dy: labelOffset + 10, anchor: 'middle', baseline: 'alphabetic' },
      R: { dx: labelSideShift, dy: labelOffset + 10, anchor: 'start', baseline: 'alphabetic' }
    }

    // Draw points
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    Object.entries(points).forEach(([name, pt]) => {
      const x = scaleX(pt.x)
      const y = scaleY(pt.y)

      group
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', pointRadius)
        .attr('fill', pointFill)
        .attr('stroke', pointFill)
        .attr('stroke-width', 0)

      const override = labelOverrides[name]
      const isAbove = pt.y < centerY
      const isLeft = pt.x < centerX - (maxX - minX) * 0.15
      const isRight = pt.x > centerX + (maxX - minX) * 0.15
      const xShift = override
        ? override.dx
        : isLeft
          ? -labelSideShift
          : isRight
            ? labelSideShift
            : 0
      const yShift = override ? override.dy : isAbove ? -labelOffset : labelOffset
      const textAnchor = override
        ? override.anchor
        : isLeft
          ? 'end'
          : isRight
            ? 'start'
            : 'middle'
      const dominantBaseline = override?.baseline ?? 'middle'
      group
        .append('text')
        .attr('x', x + xShift)
        .attr('y', y + yShift)
        .attr('text-anchor', textAnchor)
        .attr('dominant-baseline', dominantBaseline)
        .attr('fill', pointFill)
        .attr('font-size', labelFontSize)
        .attr('font-style', 'italic')
        .attr('font-weight', 600)
        .text(name)
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
