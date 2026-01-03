import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type RespiratoryPoint = {
  x: number
  y: number
}

type RespiratoryData = {
  points?: RespiratoryPoint[]
  steps?: number
  t1?: number
  t2?: number
  f1?: number
  f2?: number
  xEnd?: number
  curveK?: number
  debug?: boolean
  labels?: {
    x?: string
    y?: string
    t1?: string
    t2?: string
    f1?: string
    f2?: string
    note?: string
  }
}

export const renderQ145Respiratory = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as RespiratoryData
    const t1 = payload.t1 ?? 0.33
    const t2 = payload.t2 ?? 0.66
    const f1 = payload.f1 ?? 0.5
    const f2 = payload.f2 ?? 0.25
    const xEnd = Math.max(payload.xEnd ?? 0.92, t2 + 0.02)
    const curveK = payload.curveK ?? 8
    const steps = Math.max(3, payload.steps ?? 24)
    const debug = payload.debug ?? false
    const labels = {
      x: 'Tempo (min)',
      y: 'Frequencia respiratoria (rpm)',
      t1: 't1',
      t2: 't2',
      f1: 'f1',
      f2: 'f2',
      note: 'Inicio da pratica meditativa',
      ...(payload.labels || {})
    }
    const points =
      payload.points ||
      [
        { x: 0, y: f1 },
        { x: t1, y: f1 },
        ...Array.from({ length: steps - 1 }, (_, index) => {
          const t = (index + 1) / steps
          const sigmoid = (value: number) => 1 / (1 + Math.exp(-curveK * (value - 0.5)))
          const min = sigmoid(0)
          const max = sigmoid(1)
          const eased = (sigmoid(t) - min) / (max - min)
          return {
            x: t1 + (t2 - t1) * t,
            y: f1 - (f1 - f2) * eased
          }
        }),
        { x: t2, y: f2 },
        { x: xEnd, y: f2 }
      ]

    const margin = { top: 1, right: 48, bottom: 42, left: 56 }
    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = Math.max(0, height - margin.top - margin.bottom)

    if (innerWidth === 0 || innerHeight === 0) {
      return
    }

    const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth])
    const y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0])

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Grafico de frequencia respiratoria')
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
      .attr('id', 'q145-axis-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 7)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4Z')
      .attr('fill', theme.textColor)

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

    chart
      .append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', innerHeight)
      .attr('y2', 0)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#q145-axis-arrow)')

    chart
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight)
      .attr('y2', innerHeight)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#q145-axis-arrow)')

    chart
      .append('line')
      .attr('x1', x(t1))
      .attr('x2', x(t1))
      .attr('y1', innerHeight)
      .attr('y2', y(f1))
      .attr('stroke', theme.gridColor)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4')

    chart
      .append('line')
      .attr('x1', x(t2))
      .attr('x2', x(t2))
      .attr('y1', innerHeight)
      .attr('y2', y(f2))
      .attr('stroke', theme.gridColor)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4')

    chart
      .append('line')
      .attr('x1', 0)
      .attr('x2', x(t2))
      .attr('y1', y(f2))
      .attr('y2', y(f2))
      .attr('stroke', theme.gridColor)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4')

    const line = d3
      .line<RespiratoryPoint>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveMonotoneX)

    chart
      .append('path')
      .datum(points)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#2f9bff')
      .attr('stroke-width', 3)

    const addSubscriptLabel = (selection: d3.Selection<SVGTextElement, unknown, null, undefined>, label: string) => {
      const match = label.match(/^([A-Za-z])_?(\d+)$/)
      if (!match) {
        selection.text(label)
        return
      }
      selection.text(null)
      selection.append('tspan').text(match[1])
      selection.append('tspan').text(match[2]).attr('font-size', '70%').attr('baseline-shift', 'sub')
    }

    const appendLabel = ({
      x,
      y,
      label,
      anchor = 'middle',
      size = 12,
      fill = theme.textColor,
      rotate = false,
      muted = false,
      baseline
    }: {
      x: number
      y: number
      label: string
      anchor?: 'start' | 'middle' | 'end'
      size?: number
      fill?: string
      rotate?: boolean
      muted?: boolean
      baseline?: string
    }) => {
      const text = chart
        .append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', anchor)
        .attr('fill', muted ? theme.mutedTextColor : fill)
        .attr('font-size', size)
      if (baseline) {
        text.attr('dominant-baseline', baseline)
      }
      if (rotate) {
        text.attr('transform', `rotate(-90 ${x} ${y})`)
      }
      if (label.includes('\n')) {
        const lines = label.split('\n')
        text.text(null)
        lines.forEach((line, index) => {
          text
            .append('tspan')
            .attr('x', x)
            .attr('dy', index === 0 ? '0' : '1.1em')
            .text(line)
        })
      } else {
        addSubscriptLabel(text, label)
      }
    }

    appendLabel({
      x: -28,
      y: innerHeight / 2,
      label: labels.y || '',
      rotate: true
    })

    appendLabel({
      x: innerWidth,
      y: innerHeight + 20,
      label: labels.x || '',
      anchor: 'end'
    })

    appendLabel({
      x: x(t1),
      y: innerHeight + 8,
      label: labels.t1 || '',
      baseline: 'hanging'
    })

    appendLabel({
      x: x(t2),
      y: innerHeight + 8,
      label: labels.t2 || '',
      baseline: 'hanging'
    })
    appendLabel({
      x: x(t1),
      y: innerHeight + 29,
      label: labels.note || '',
      size: 10,
      muted: true
    })

    appendLabel({
      x: -10,
      y: y(f1),
      label: labels.f1 || '',
      anchor: 'end',
      baseline: 'middle'
    })

    appendLabel({
      x: -10,
      y: y(f2),
      label: labels.f2 || '',
      anchor: 'end',
      baseline: 'middle'
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
