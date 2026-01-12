import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type TunnelSegment = {
  label: string
  width: number
}

type DimensionSegment = {
  label: string
  width: number
}

type TunnelSpec = {
  label: string
  diameter: number
  segments: TunnelSegment[]
  x?: number
  dimensionLabel?: string
  dimensionSegments?: DimensionSegment[]
}

type TunnelData = {
  title?: string
  layoutWidth?: number
  debug?: boolean
  tunnels?: TunnelSpec[]
}

export const renderQ167Tunnel = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as TunnelData
    const debug = payload.debug ?? meta.debug ?? false
    const tunnels = payload.tunnels || []
    const layoutWidth = payload.layoutWidth ?? 20

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Projeto de tunel')
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

    const margin = { top: 18, right: 16, bottom: 0, left: 16 }
    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = Math.max(0, height - margin.top - margin.bottom)

    if (innerWidth === 0 || innerHeight === 0) {
      return
    }

    const root = typeof document === 'undefined' ? null : document.documentElement
    const isDarkMode = Boolean(root?.classList.contains('dark'))
    const lightSurface = '#ffffff'
    const darkSurface = '#2a2a2a'
    const tunnelFill = isDarkMode ? lightSurface : darkSurface
    const tunnelLine = isDarkMode ? darkSurface : lightSurface
    const outerText = theme.textColor

    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'q167-arrow-end')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 6.5)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4Z')
      .attr('fill', outerText)

    defs
      .append('marker')
      .attr('id', 'q167-arrow-start')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 1.5)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M8,-4L0,0L8,4Z')
      .attr('fill', outerText)

    const group = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    if (debug) {
      group
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'rgba(0, 128, 255, 0.05)')
        .attr('stroke', 'rgba(0, 128, 255, 0.3)')
    }

    if (payload.title) {
      group
        .append('text')
        .attr('x', innerWidth / 2)
        .attr('y', 4)
        .attr('text-anchor', 'middle')
        .attr('fill', outerText)
        .attr('font-size', 14)
        .attr('font-weight', 600)
        .text(payload.title)
    }

    const maxDiameter =
      tunnels.length > 0 ? Math.max(...tunnels.map((tunnel) => tunnel.diameter)) : 1
    const labelGap = 26
    const dimensionGap = 40
    const availableHeight = innerHeight - labelGap - dimensionGap
    const maxScaleByHeight =
      availableHeight > 0 ? (availableHeight * 2) / maxDiameter : innerWidth / layoutWidth
    const meterScale = Math.min(innerWidth / layoutWidth, maxScaleByHeight)
    const usedWidth = layoutWidth * meterScale
    const radiusMax = (maxDiameter * meterScale) / 2
    const usedHeight = labelGap + radiusMax + dimensionGap
    const offsetX = (innerWidth - usedWidth) / 2
    const offsetY = (innerHeight - usedHeight) / 2

    const plot = group
      .append('g')
      .attr('transform', `translate(${offsetX},${offsetY})`)

    const baseY = labelGap + radiusMax

    const drawTunnel = (tunnel: TunnelSpec) => {
      const diameterPx = tunnel.diameter * meterScale
      const radius = diameterPx / 2
      const startX = (tunnel.x ?? 0) * meterScale
      const centerX = startX + radius

      const arcFill = d3
        .arc()
        .innerRadius(0)
        .outerRadius(radius)
        .startAngle(Math.PI)
        .endAngle(0)

      const arcStroke = d3
        .arc()
        .innerRadius(radius)
        .outerRadius(radius)
        .startAngle(Math.PI)
        .endAngle(0)

      const arcTransform = `translate(${centerX}, ${baseY}) rotate(-90)`

      plot
        .append('path')
        .attr('d', arcFill({} as any))
        .attr('transform', arcTransform)
        .attr('fill', tunnelFill)
        .attr('stroke', 'none')

      plot
        .append('path')
        .attr('d', arcStroke({} as any))
        .attr('transform', arcTransform)
        .attr('fill', 'none')
        .attr('stroke', tunnelLine)
        .attr('stroke-width', 1.4)

      const floorY = baseY - 0.5

      if (tunnel.label) {
        plot
          .append('text')
          .attr('x', centerX)
          .attr('y', baseY - radius - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', outerText)
          .attr('font-size', 12)
          .text(tunnel.label)
      }

      if (tunnel.segments.length > 0) {
        const total = tunnel.segments.reduce((sum, seg) => sum + seg.width, 0)
        let cursor = centerX - radius

        tunnel.segments.forEach((segment, index) => {
          const segWidth = (segment.width / total) * diameterPx
          const mid = cursor + segWidth / 2

          plot
            .append('text')
            .attr('x', mid)
            .attr('y', floorY - 8)
            .attr('text-anchor', 'middle')
            .attr('fill', tunnelLine)
            .attr('font-size', 12)
            .text(segment.label)

          if (index > 0) {
            plot
              .append('line')
              .attr('x1', cursor)
              .attr('x2', cursor)
              .attr('y1', floorY - 6)
              .attr('y2', floorY + 6)
              .attr('stroke', tunnelLine)
              .attr('stroke-width', 1.2)
          }

          cursor += segWidth
        })
      }

      const dimensionY = baseY + 14

      if (tunnel.dimensionSegments && tunnel.dimensionSegments.length > 0) {
        const total = tunnel.dimensionSegments.reduce(
          (sum, seg) => sum + seg.width,
          0
        )
        let cursor = centerX - radius

        tunnel.dimensionSegments.forEach((segment) => {
          const segWidth = (segment.width / total) * diameterPx
          const end = cursor + segWidth
          const mid = cursor + segWidth / 2

          plot
            .append('line')
            .attr('x1', cursor)
            .attr('x2', end)
            .attr('y1', dimensionY)
            .attr('y2', dimensionY)
            .attr('stroke', outerText)
            .attr('stroke-width', 1.2)
            .attr('marker-start', 'url(#q167-arrow-start)')
            .attr('marker-end', 'url(#q167-arrow-end)')

          plot
            .append('text')
            .attr('x', mid)
            .attr('y', dimensionY + 16)
            .attr('text-anchor', 'middle')
            .attr('fill', outerText)
            .attr('font-size', 12)
            .text(segment.label)

          cursor = end
        })
      } else if (tunnel.dimensionLabel) {
        plot
          .append('line')
          .attr('x1', centerX - radius)
          .attr('x2', centerX + radius)
          .attr('y1', dimensionY)
          .attr('y2', dimensionY)
          .attr('stroke', outerText)
          .attr('stroke-width', 1.2)
          .attr('marker-start', 'url(#q167-arrow-start)')
          .attr('marker-end', 'url(#q167-arrow-end)')

        plot
          .append('text')
          .attr('x', centerX)
          .attr('y', dimensionY + 16)
          .attr('text-anchor', 'middle')
          .attr('fill', outerText)
          .attr('font-size', 12)
          .text(tunnel.dimensionLabel)
      }
    }

    tunnels.forEach((tunnel) => {
      drawTunnel(tunnel)
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
