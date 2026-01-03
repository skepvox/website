import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type NutritionCardPlacement =
  | 'top-left'
  | 'top-right'
  | 'mid-left'
  | 'mid-right'
  | 'bottom-center'

type NutritionCard = {
  id: string
  title: string
  lines: string[]
  fill: string
  placement?: NutritionCardPlacement
}

type NutritionData = {
  cards?: NutritionCard[]
  debug?: boolean
}

const DEFAULT_PLACEMENTS: NutritionCardPlacement[] = [
  'top-left',
  'top-right',
  'mid-left',
  'mid-right',
  'bottom-center'
]

export const renderQ143Nutrition = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as NutritionData
    const cards = payload.cards || []
    const debug = payload.debug ?? meta.debug ?? false

    if (width <= 0 || height <= 0) return

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Informacoes nutricionais')
      .style('font-family', theme.fontFamily)

    if (debug) {
      svg
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'rgba(255, 0, 0, 0.05)')
        .attr('stroke', 'rgba(255, 0, 0, 0.25)')
    }

    const colGap = Math.max(2, Math.round(width * 0.008))
    const rowGap = Math.max(2, Math.round(height * 0.01))
    const colWidth = (width - colGap) / 2
    const rowHeight = (height - rowGap * 2) / 3

    if (colWidth <= 0 || rowHeight <= 0) return

    const positions: Record<NutritionCardPlacement, { x: number; y: number; w: number; h: number }> = {
      'top-left': { x: 0, y: 0, w: colWidth, h: rowHeight },
      'top-right': { x: colWidth + colGap, y: 0, w: colWidth, h: rowHeight },
      'mid-left': { x: 0, y: rowHeight + rowGap, w: colWidth, h: rowHeight },
      'mid-right': {
        x: colWidth + colGap,
        y: rowHeight + rowGap,
        w: colWidth,
        h: rowHeight
      },
      'bottom-center': {
        x: (width - colWidth) / 2,
        y: rowHeight * 2 + rowGap * 2,
        w: colWidth,
        h: rowHeight
      }
    }

    const titleSize = Math.max(12, rowHeight * 0.14)
    const bodySize = Math.max(10, rowHeight * 0.1)
    const textColor = '#111'
    const titleY = 0.25
    const line1Y = 0.54
    const line2Y = 0.74

    cards.forEach((card, index) => {
      const placement = card.placement ?? DEFAULT_PLACEMENTS[index] ?? 'top-left'
      const box = positions[placement] || positions['top-left']
      const lines = card.lines || []

      const cardGroup = svg
        .append('g')
        .attr('transform', `translate(${box.x}, ${box.y})`)

      cardGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', box.w)
        .attr('height', box.h)
        .attr('fill', card.fill || '#f0f0f0')

      const centerX = box.w / 2

      cardGroup
        .append('text')
        .attr('x', centerX)
        .attr('y', box.h * titleY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', textColor)
        .attr('font-size', titleSize)
        .attr('font-weight', 600)
        .text(card.title)

      if (lines[0]) {
        cardGroup
          .append('text')
          .attr('x', centerX)
          .attr('y', box.h * line1Y)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', textColor)
          .attr('font-size', bodySize)
          .text(lines[0])
      }

      if (lines[1]) {
        cardGroup
          .append('text')
          .attr('x', centerX)
          .attr('y', box.h * line2Y)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', textColor)
          .attr('font-size', bodySize)
          .text(lines[1])
      }
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
