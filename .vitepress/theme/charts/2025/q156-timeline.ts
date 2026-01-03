import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type Segment = {
  from: number
  to: number
  label: string
}

type TimeMark = {
  km: number
  label: string
}

type TimelineData = {
  kmMarks?: number[]
  timeMarks?: TimeMark[]
  segmentTimes?: Segment[]
  segmentLabels?: Segment[]
  debug?: boolean
  labels?: {
    timeLabel?: string
    segmentLabel?: string
    distanceLabel?: string
  }
}

const DEFAULT_TIME_COLOR = '#27c4d0'
const DEFAULT_SEGMENT_COLOR = '#57b95b'
const DOT_COLOR = '#d64b42'
const LINE_WIDTH = 1.5
const ARROW_SIZE = 5
const ARROW_DOWN_GAP = 10
const ARROW_PADDING = 1
const HORIZONTAL_ARROW_INSET = 6 + ARROW_PADDING

const renderRunner = (
  group: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number,
  color: string
) => {
  const runner = group.append('g').attr('transform', `translate(${x},${y})`)
  const strokeWidth = 2

  runner
    .append('circle')
    .attr('cx', 6)
    .attr('cy', -22)
    .attr('r', 4)
    .attr('fill', color)

  runner
    .append('line')
    .attr('x1', 4)
    .attr('y1', -18)
    .attr('x2', 0)
    .attr('y2', -8)
    .attr('stroke', color)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-linecap', 'round')

  runner
    .append('line')
    .attr('x1', 2)
    .attr('y1', -14)
    .attr('x2', -10)
    .attr('y2', -18)
    .attr('stroke', color)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-linecap', 'round')

  runner
    .append('line')
    .attr('x1', 3)
    .attr('y1', -14)
    .attr('x2', 14)
    .attr('y2', -10)
    .attr('stroke', color)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-linecap', 'round')

  runner
    .append('polyline')
    .attr('points', '0,-8 9,-2 14,-4')
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')

  runner
    .append('polyline')
    .attr('points', '0,-8 -6,-2 -14,2')
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
}

export const renderQ156Timeline = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as TimelineData
    const debug = payload.debug ?? meta.debug ?? false
    const kmMarks = payload.kmMarks || [0, 1, 2, 3, 4, 5]
    const timeMarks =
      payload.timeMarks || [
        { km: 0, label: '0 s' },
        { km: 1, label: '272 s' },
        { km: 2, label: '556 s' },
        { km: 3, label: '844 s' },
        { km: 4, label: '1 132 s' }
      ]
    const segmentTimes =
      payload.segmentTimes || [
        { from: 0, to: 1, label: '272 s' },
        { from: 1, to: 2, label: '284 s' },
        { from: 2, to: 3, label: '288 s' },
        { from: 3, to: 4, label: '288 s' }
      ]
    const segmentLabels =
      payload.segmentLabels || [
        { from: 0, to: 1, label: '1º trecho' },
        { from: 1, to: 2, label: '2º trecho' },
        { from: 2, to: 3, label: '3º trecho' },
        { from: 3, to: 4, label: '4º trecho' },
        { from: 4, to: 5, label: '5º trecho' }
      ]
    const labels = {
      timeLabel: 'Tempo de corrida',
      segmentLabel: 'Tempo gasto em\ncada trecho de 1 km',
      distanceLabel: 'Comprimento\ndo percurso',
      ...(payload.labels || {})
    }

    const margin = { top: 1, right: 18, bottom: 1, left: 140 }
    const verticalShift = 0
    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = Math.max(0, height - margin.top - margin.bottom)

    if (innerWidth === 0 || innerHeight === 0) {
      return
    }

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Linha do tempo de corrida')
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

    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'q156-arrow-down')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 4)
      .attr('refY', 0)
      .attr('markerWidth', ARROW_SIZE)
      .attr('markerHeight', ARROW_SIZE)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4Z')
      .attr('fill', DEFAULT_TIME_COLOR)

    defs
      .append('marker')
      .attr('id', 'q156-arrow-green')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 4)
      .attr('refY', 0)
      .attr('markerWidth', ARROW_SIZE)
      .attr('markerHeight', ARROW_SIZE)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4Z')
      .attr('fill', DEFAULT_SEGMENT_COLOR)

    defs
      .append('marker')
      .attr('id', 'q156-arrow-green-start')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 4)
      .attr('refY', 0)
      .attr('markerWidth', ARROW_SIZE)
      .attr('markerHeight', ARROW_SIZE)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M8,-4L0,0L8,4Z')
      .attr('fill', DEFAULT_SEGMENT_COLOR)

    defs
      .append('marker')
      .attr('id', 'q156-arrow-black')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 4)
      .attr('refY', 0)
      .attr('markerWidth', ARROW_SIZE)
      .attr('markerHeight', ARROW_SIZE)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4Z')
      .attr('fill', theme.textColor)

    defs
      .append('marker')
      .attr('id', 'q156-arrow-black-start')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 4)
      .attr('refY', 0)
      .attr('markerWidth', ARROW_SIZE)
      .attr('markerHeight', ARROW_SIZE)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M8,-4L0,0L8,4Z')
      .attr('fill', theme.textColor)

    const chart = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top + verticalShift})`)

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

    const x = d3
      .scaleLinear()
      .domain([0, 5])
      .range([0, innerWidth])

    const topY = innerHeight * 0.05
    const arrowBandY = innerHeight * 0.22
    const baselineY = innerHeight * 0.54
    const bottomArrowY = innerHeight * 0.78
    const bottomTextY = innerHeight * 0.92
    const distanceLabelY = baselineY

    const labelGroup = svg
      .append('g')
      .attr('transform', `translate(0,${margin.top + verticalShift})`)

    labelGroup
      .append('text')
      .attr('x', margin.left - 22)
      .attr('y', topY)
      .attr('text-anchor', 'end')
      .attr('fill', DEFAULT_TIME_COLOR)
      .attr('font-size', 13)
      .text(labels.timeLabel || '')

    const segmentLines = (labels.segmentLabel || '').split('\n')
    segmentLines.forEach((line, index) => {
      labelGroup
        .append('text')
        .attr('x', margin.left - 22)
        .attr('y', arrowBandY + index * 14)
        .attr('text-anchor', 'end')
        .attr('fill', DEFAULT_SEGMENT_COLOR)
        .attr('font-size', 12)
        .text(line)
    })

    const distanceLines = (labels.distanceLabel || '').split('\n')
    distanceLines.forEach((line, index) => {
      labelGroup
        .append('text')
        .attr('x', margin.left - 22)
        .attr('y', distanceLabelY + index * 14)
        .attr('text-anchor', 'end')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .text(line)
    })

    chart
      .append('line')
      .attr('x1', -18)
      .attr('x2', innerWidth + 18)
      .attr('y1', baselineY)
      .attr('y2', baselineY)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', LINE_WIDTH)

    kmMarks.forEach((km) => {
      chart
        .append('circle')
        .attr('cx', x(km))
        .attr('cy', baselineY)
        .attr('r', 4)
        .attr('fill', DOT_COLOR)

      chart
        .append('text')
        .attr('x', x(km))
        .attr('y', baselineY + 18)
        .attr('text-anchor', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)
        .text(`${km} km`)
    })

    const timeMarkMax = d3.max(timeMarks, (mark) => mark.km) ?? 0
    timeMarks.forEach((mark) => {
      const isLastMark = mark.km === timeMarkMax
      const arrowStartY = topY + 10 + ARROW_PADDING
      const standardEndY = baselineY - ARROW_DOWN_GAP - ARROW_PADDING
      const arrowEndY = isLastMark
        ? arrowStartY + (standardEndY - arrowStartY) * 0.5 + 10
        : standardEndY
      chart
        .append('line')
        .attr('x1', x(mark.km))
        .attr('x2', x(mark.km))
        .attr('y1', arrowStartY)
        .attr('y2', arrowEndY)
        .attr('stroke', DEFAULT_TIME_COLOR)
        .attr('stroke-width', LINE_WIDTH)
        .attr('marker-end', 'url(#q156-arrow-down)')

      chart
        .append('text')
        .attr('x', x(mark.km))
        .attr('y', topY)
        .attr('text-anchor', 'middle')
        .attr('fill', DEFAULT_TIME_COLOR)
        .attr('font-size', 12)
        .text(mark.label)
    })

    segmentTimes.forEach((segment) => {
      const xStart = x(segment.from)
      const xEnd = x(segment.to)
      chart
        .append('line')
        .attr('x1', xStart + HORIZONTAL_ARROW_INSET)
        .attr('x2', xEnd - HORIZONTAL_ARROW_INSET)
        .attr('y1', arrowBandY)
        .attr('y2', arrowBandY)
        .attr('stroke', DEFAULT_SEGMENT_COLOR)
        .attr('stroke-width', LINE_WIDTH)
        .attr('marker-start', 'url(#q156-arrow-green-start)')
        .attr('marker-end', 'url(#q156-arrow-green)')

      chart
        .append('text')
        .attr('x', (xStart + xEnd) / 2)
        .attr('y', arrowBandY + 16)
        .attr('text-anchor', 'middle')
        .attr('fill', DEFAULT_SEGMENT_COLOR)
        .attr('font-size', 12)
        .text(segment.label)
    })

    segmentLabels.forEach((segment) => {
      const xStart = x(segment.from)
      const xEnd = x(segment.to)
      chart
        .append('line')
        .attr('x1', xStart + HORIZONTAL_ARROW_INSET)
        .attr('x2', xEnd - HORIZONTAL_ARROW_INSET)
        .attr('y1', bottomArrowY)
        .attr('y2', bottomArrowY)
        .attr('stroke', theme.textColor)
        .attr('stroke-width', LINE_WIDTH)
        .attr('marker-start', 'url(#q156-arrow-black-start)')
        .attr('marker-end', 'url(#q156-arrow-black)')

      const labelText = chart
        .append('text')
        .attr('x', (xStart + xEnd) / 2)
        .attr('y', bottomTextY - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', theme.textColor)
        .attr('font-size', 12)

      const [prefix, ...rest] = segment.label.split(' ')
      const suffix = rest.join(' ')
      labelText.append('tspan').attr('x', (xStart + xEnd) / 2).text(prefix)
      if (suffix) {
        labelText
          .append('tspan')
          .attr('x', (xStart + xEnd) / 2)
          .attr('dy', 14)
          .text(suffix)
      }
    })

    const tickPositions = Array.from(
      new Set(segmentLabels.flatMap((segment) => [segment.from, segment.to]))
    )
    tickPositions.forEach((mark) => {
      chart
        .append('line')
        .attr('x1', x(mark))
        .attr('x2', x(mark))
        .attr('y1', bottomArrowY - 10)
        .attr('y2', bottomArrowY + 10)
        .attr('stroke', theme.textColor)
        .attr('stroke-width', LINE_WIDTH)
    })

    const runnerGroup = chart.append('g')
    renderRunner(runnerGroup, x(4) - 6, baselineY - 8, theme.textColor)
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
