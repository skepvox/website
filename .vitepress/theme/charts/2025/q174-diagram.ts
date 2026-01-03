import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type DiagramNode = {
  id: string
  label?: string
  color?: string
}

type DiagramData = {
  nodes?: DiagramNode[]
  direction?: 'clockwise' | 'counterclockwise'
}

const DEFAULT_NODE_COLORS = ['#b57a2a', '#5469f0', '#e67f2d', '#31b76b']

export const renderQ174Diagram = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Diagrama')
      .style('font-family', theme.fontFamily)

    const payload = (data[0] || {}) as DiagramData
    const nodes = payload.nodes?.length
      ? payload.nodes
      : [
          { id: '1', label: '1' },
          { id: '2', label: '2' },
          { id: '3', label: '3' },
          { id: '4', label: '4' }
        ]
    const direction = payload.direction || 'clockwise'

    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.32
    const nodeRadius = Math.min(width, height) * 0.08
    const step = (Math.PI * 2) / nodes.length
    const startAngle = -Math.PI / 2
    const arrowGap = Math.min(nodeRadius / radius, 0.35)

    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'q174-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 7)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4Z')
      .attr('fill', theme.textColor)

    nodes.forEach((node, index) => {
      const angle = direction === 'clockwise'
        ? startAngle + index * step
        : startAngle - index * step
      const nextAngle = direction === 'clockwise' ? angle + step : angle - step
      const path = d3.path()
      path.arc(
        centerX,
        centerY,
        radius,
        angle + arrowGap,
        nextAngle - arrowGap,
        direction === 'counterclockwise'
      )
      svg
        .append('path')
        .attr('d', path.toString())
        .attr('fill', 'none')
        .attr('stroke', theme.textColor)
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#q174-arrow)')
    })

    nodes.forEach((node, index) => {
      const angle = direction === 'clockwise'
        ? startAngle + index * step
        : startAngle - index * step
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      const color = node.color || DEFAULT_NODE_COLORS[index % DEFAULT_NODE_COLORS.length]

      svg
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', nodeRadius)
        .attr('fill', color)
        .attr('stroke', theme.axisColor)
        .attr('stroke-width', 1)

      svg
        .append('text')
        .attr('x', x)
        .attr('y', y + 1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', Math.max(12, nodeRadius))
        .attr('font-weight', 600)
        .text(node.label || node.id)
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
