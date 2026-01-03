import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type PolygonShape = {
  points: [number, number][]
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
}

type PolygonData = {
  width?: number
  height?: number
  padding?: number
  stroke?: string
  strokeWidth?: number
  expand?: number
  allowScaleUp?: boolean
  debug?: boolean
  shapes?: PolygonShape[]
}

export const renderQ136Polygons = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as PolygonData
    const shapes = payload.shapes || []
    const baseWidth = payload.width ?? 0
    const baseHeight = payload.height ?? 0
    const padding = payload.padding ?? 0
    const stroke = payload.stroke ?? theme.textColor
    const strokeWidth = payload.strokeWidth ?? 1.5
    const expand = payload.expand ?? 0
    const allowScaleUp = payload.allowScaleUp ?? false
    const debug = payload.debug ?? meta.debug ?? false

    const layoutWidth = baseWidth + padding * 2
    const layoutHeight = baseHeight + padding * 2

    const margin = { top: 6, right: 6, bottom: 6, left: 6 }
    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = Math.max(0, height - margin.top - margin.bottom)

    if (innerWidth === 0 || innerHeight === 0 || layoutWidth === 0 || layoutHeight === 0) {
      return
    }

    const maxScale = allowScaleUp ? Number.POSITIVE_INFINITY : 1
    const scale = Math.min(maxScale, innerWidth / layoutWidth, innerHeight / layoutHeight)
    const usedWidth = layoutWidth * scale
    const usedHeight = layoutHeight * scale

    const offsetX =
      margin.left + (innerWidth - usedWidth) / 2 + Math.max(0, padding * scale)
    const offsetY =
      margin.top + (innerHeight - usedHeight) / 2 + Math.max(0, padding * scale)

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Diagrama do poliedro')
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

      svg
        .append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'rgba(0, 128, 255, 0.05)')
        .attr('stroke', 'rgba(0, 128, 255, 0.3)')
    }

    const plot = svg
      .append('g')
      .attr('transform', `translate(${offsetX}, ${offsetY}) scale(${scale})`)

    const expandPoints = (points: [number, number][]) => {
      if (expand <= 0) {
        return points
      }
      let area = 0
      let cx = 0
      let cy = 0
      for (let i = 0; i < points.length; i += 1) {
        const [x1, y1] = points[i]
        const [x2, y2] = points[(i + 1) % points.length]
        const cross = x1 * y2 - x2 * y1
        area += cross
        cx += (x1 + x2) * cross
        cy += (y1 + y2) * cross
      }
      if (area === 0) {
        const avgX = points.reduce((sum, [x]) => sum + x, 0) / points.length
        const avgY = points.reduce((sum, [, y]) => sum + y, 0) / points.length
        return points.map(([x, y]) => [avgX + (x - avgX) * (1 + expand), avgY + (y - avgY) * (1 + expand)])
      }
      area *= 0.5
      cx /= 6 * area
      cy /= 6 * area
      return points.map(([x, y]) => [cx + (x - cx) * (1 + expand), cy + (y - cy) * (1 + expand)])
    }

    shapes.forEach((shape) => {
      const expandedPoints = expandPoints(shape.points)
      const points = expandedPoints.map((point) => point.join(',')).join(' ')
      const shapeStrokeWidth = shape.strokeWidth ?? strokeWidth
      plot
        .append('polygon')
        .attr('points', points)
        .attr('fill', shape.fill ?? 'none')
        .attr('stroke', shapeStrokeWidth > 0 ? shape.stroke ?? stroke : 'none')
        .attr('stroke-width', shapeStrokeWidth)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('opacity', shape.opacity ?? 1)
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
