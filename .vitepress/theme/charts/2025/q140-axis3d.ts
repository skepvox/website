import * as d3 from 'd3'
import type { ChartInstance, ChartRenderInput } from '../types'

type Projection = {
  plane: 'xy' | 'xz' | 'yz'
  x: number
  y: number
  z: number
  size?: number
}

type Cube = {
  x: number
  y: number
  z: number
  size?: number
}

type Axis3dData = {
  gridSize?: number
  cubeSize?: number
  projectionColor?: string
  cubeColor?: string
  cube?: Cube
  projections?: Projection[]
  showCube?: boolean
  skipCubeProjections?: ('xy' | 'xz' | 'yz')[]
  debug?: boolean
}

// Isometric projection: 30° angles
const ISO_ANGLE = Math.PI / 6 // 30 degrees
const COS_30 = Math.cos(ISO_ANGLE)
const SIN_30 = Math.sin(ISO_ANGLE)

// Transform 3D point to 2D isometric
const toIso = (x: number, y: number, z: number): [number, number] => {
  const isoX = (y - x) * COS_30
  const isoY = -z + (x + y) * SIN_30
  return [isoX, isoY]
}

export const renderQ140Axis3d = (input: ChartRenderInput): ChartInstance => {
  let state = { ...input }

  const draw = () => {
    const { el, data, meta, theme, width, height } = state
    const container = d3.select(el)
    container.selectAll('*').remove()

    const payload = (data[0] || {}) as Axis3dData
    const debug = payload.debug ?? meta.debug ?? false
    const gridSize = payload.gridSize ?? 10
    const defaultCubeSize = payload.cubeSize ?? 1
    const projectionColor = payload.projectionColor ?? '#e63946'
    const cubeColor = payload.cubeColor ?? '#3b82f6'
    const showCube = payload.showCube ?? false
    const cube = payload.cube
    const projections = payload.projections || []
    const skipCubeProjections = payload.skipCubeProjections || []

    const margin = { top: 4, right: 20, bottom: 4, left: 30 }
    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = Math.max(0, height - margin.top - margin.bottom)

    if (innerWidth === 0 || innerHeight === 0) return

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', meta.title || 'Sistema de coordenadas 3D')
      .style('font-family', theme.fontFamily)

    // Calculate scale to fit the isometric view
    const testPoints = [
      toIso(0, 0, 0),
      toIso(gridSize, 0, 0),
      toIso(0, gridSize, 0),
      toIso(0, 0, gridSize),
      toIso(gridSize, gridSize, 0)
    ]
    const minX = Math.min(...testPoints.map(p => p[0]))
    const maxX = Math.max(...testPoints.map(p => p[0]))
    const minY = Math.min(...testPoints.map(p => p[1]))
    const maxY = Math.max(...testPoints.map(p => p[1]))

    const isoWidth = maxX - minX
    const isoHeight = maxY - minY
    const scale = Math.min(innerWidth / isoWidth, innerHeight / isoHeight) * 0.85

    // Center the view - compute actual scaled bounds
    const scaledCenterIsoX = (minX + maxX) / 2 * scale
    const scaledCenterIsoY = (minY + maxY) / 2 * scale
    const centerX = margin.left + innerWidth / 2 - scaledCenterIsoX
    const centerY = margin.top + innerHeight / 2 - scaledCenterIsoY + 10

    const chart = svg.append('g')

    // Helper to transform and scale
    const project = (x: number, y: number, z: number): [number, number] => {
      const [isoX, isoY] = toIso(x, y, z)
      return [centerX + isoX * scale, centerY + isoY * scale]
    }

    // Debug overlays
    if (debug) {
      // Outer bounds (red)
      svg.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', width).attr('height', height)
        .attr('fill', 'rgba(255, 0, 0, 0.06)')
        .attr('stroke', 'rgba(255, 0, 0, 0.3)')

      // Inner bounds (blue)
      svg.append('rect')
        .attr('x', margin.left).attr('y', margin.top)
        .attr('width', innerWidth).attr('height', innerHeight)
        .attr('fill', 'rgba(0, 128, 255, 0.05)')
        .attr('stroke', 'rgba(0, 128, 255, 0.3)')

      // Center crosshair (green)
      svg.append('line')
        .attr('x1', centerX - 10).attr('y1', centerY)
        .attr('x2', centerX + 10).attr('y2', centerY)
        .attr('stroke', 'rgba(0, 255, 0, 0.6)')
        .attr('stroke-width', 1)
      svg.append('line')
        .attr('x1', centerX).attr('y1', centerY - 10)
        .attr('x2', centerX).attr('y2', centerY + 10)
        .attr('stroke', 'rgba(0, 255, 0, 0.6)')
        .attr('stroke-width', 1)

      // Origin marker (yellow)
      const [debugOx, debugOy] = project(0, 0, 0)
      svg.append('circle')
        .attr('cx', debugOx).attr('cy', debugOy)
        .attr('r', 4)
        .attr('fill', 'rgba(255, 200, 0, 0.8)')
        .attr('stroke', 'rgba(255, 150, 0, 1)')
        .attr('stroke-width', 1)
    }

    // Define arrow marker
    const defs = svg.append('defs')
    defs.append('marker')
      .attr('id', 'q140-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 7)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L8,0L0,3Z')
      .attr('fill', theme.textColor)

    const gridStroke = theme.mutedTextColor
    const gridOpacity = 0.4

    // Draw XY plane (floor) - dashed grid
    const xyPlane = chart.append('g').attr('class', 'xy-plane')
    for (let i = 0; i <= gridSize; i++) {
      // Lines parallel to X
      const [x1, y1] = project(0, i, 0)
      const [x2, y2] = project(gridSize, i, 0)
      xyPlane.append('line')
        .attr('x1', x1).attr('y1', y1)
        .attr('x2', x2).attr('y2', y2)
        .attr('stroke', gridStroke)
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', gridOpacity)

      // Lines parallel to Y
      const [x3, y3] = project(i, 0, 0)
      const [x4, y4] = project(i, gridSize, 0)
      xyPlane.append('line')
        .attr('x1', x3).attr('y1', y3)
        .attr('x2', x4).attr('y2', y4)
        .attr('stroke', gridStroke)
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', gridOpacity)
    }

    // Draw XZ plane (back wall) - dashed grid
    const xzPlane = chart.append('g').attr('class', 'xz-plane')
    for (let i = 0; i <= gridSize; i++) {
      // Lines parallel to X
      const [x1, y1] = project(0, 0, i)
      const [x2, y2] = project(gridSize, 0, i)
      xzPlane.append('line')
        .attr('x1', x1).attr('y1', y1)
        .attr('x2', x2).attr('y2', y2)
        .attr('stroke', gridStroke)
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', gridOpacity)

      // Lines parallel to Z
      const [x3, y3] = project(i, 0, 0)
      const [x4, y4] = project(i, 0, gridSize)
      xzPlane.append('line')
        .attr('x1', x3).attr('y1', y3)
        .attr('x2', x4).attr('y2', y4)
        .attr('stroke', gridStroke)
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', gridOpacity)
    }

    // Draw YZ plane (side wall) - dashed grid
    const yzPlane = chart.append('g').attr('class', 'yz-plane')
    for (let i = 0; i <= gridSize; i++) {
      // Lines parallel to Y
      const [x1, y1] = project(0, 0, i)
      const [x2, y2] = project(0, gridSize, i)
      yzPlane.append('line')
        .attr('x1', x1).attr('y1', y1)
        .attr('x2', x2).attr('y2', y2)
        .attr('stroke', gridStroke)
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', gridOpacity)

      // Lines parallel to Z
      const [x3, y3] = project(0, i, 0)
      const [x4, y4] = project(0, i, gridSize)
      yzPlane.append('line')
        .attr('x1', x3).attr('y1', y3)
        .attr('x2', x4).attr('y2', y4)
        .attr('stroke', gridStroke)
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', gridOpacity)
    }

    // Draw axes
    const axisExtend = gridSize + 0.6
    const axisGroup = chart.append('g').attr('class', 'axes')

    // X axis (pointing left-down)
    const [ox, oy] = project(0, 0, 0)
    const [xEnd_x, xEnd_y] = project(axisExtend, 0, 0)
    axisGroup.append('line')
      .attr('x1', ox).attr('y1', oy)
      .attr('x2', xEnd_x).attr('y2', xEnd_y)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#q140-arrow)')

    // Y axis (pointing right-down)
    const [yEnd_x, yEnd_y] = project(0, axisExtend, 0)
    axisGroup.append('line')
      .attr('x1', ox).attr('y1', oy)
      .attr('x2', yEnd_x).attr('y2', yEnd_y)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#q140-arrow)')

    // Z axis (pointing up)
    const [zEnd_x, zEnd_y] = project(0, 0, axisExtend)
    axisGroup.append('line')
      .attr('x1', ox).attr('y1', oy)
      .attr('x2', zEnd_x).attr('y2', zEnd_y)
      .attr('stroke', theme.textColor)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#q140-arrow)')

    // Axis labels
    const labelOffset = 12
    const fontSize = Math.max(12, Math.min(16, width / 25))

    axisGroup.append('text')
      .attr('x', xEnd_x - labelOffset * 0.5)
      .attr('y', xEnd_y + labelOffset)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.textColor)
      .attr('font-size', fontSize)
      .attr('font-style', 'italic')
      .text('x')

    axisGroup.append('text')
      .attr('x', yEnd_x + labelOffset)
      .attr('y', yEnd_y + labelOffset * 0.5)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.textColor)
      .attr('font-size', fontSize)
      .attr('font-style', 'italic')
      .text('y')

    axisGroup.append('text')
      .attr('x', zEnd_x)
      .attr('y', zEnd_y - labelOffset)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.textColor)
      .attr('font-size', fontSize)
      .attr('font-style', 'italic')
      .text('z')

    // Helper to draw a filled square on a plane
    const drawSquare = (
      plane: 'xy' | 'xz' | 'yz',
      px: number, py: number, pz: number,
      size: number,
      fill: string,
      opacity: number = 0.85
    ) => {
      const inset = 0.08 // Small inset to avoid overlapping grid/axes
      const s0 = inset
      const s1 = size - inset
      let corners: [number, number][]
      if (plane === 'xy') {
        corners = [
          project(px + s0, py + s0, pz),
          project(px + s1, py + s0, pz),
          project(px + s1, py + s1, pz),
          project(px + s0, py + s1, pz)
        ]
      } else if (plane === 'xz') {
        corners = [
          project(px + s0, py, pz + s0),
          project(px + s1, py, pz + s0),
          project(px + s1, py, pz + s1),
          project(px + s0, py, pz + s1)
        ]
      } else {
        corners = [
          project(px, py + s0, pz + s0),
          project(px, py + s1, pz + s0),
          project(px, py + s1, pz + s1),
          project(px, py + s0, pz + s1)
        ]
      }
      chart.append('polygon')
        .attr('points', corners.map(c => c.join(',')).join(' '))
        .attr('fill', fill)
        .attr('stroke', fill)
        .attr('stroke-width', 1)
        .attr('opacity', opacity)
    }

    // Draw projections
    projections.forEach(proj => {
      const size = proj.size ?? defaultCubeSize
      drawSquare(proj.plane, proj.x, proj.y, proj.z, size, projectionColor)
    })

    // Draw cube if enabled
    if (showCube && cube) {
      const cx = cube.x
      const cy = cube.y
      const cz = cube.z
      const cs = cube.size ?? defaultCubeSize

      // Draw projection lines from cube to planes FIRST (behind cube)
      const projLineColor = cubeColor

      // To XY plane (floor) - from bottom of cube
      chart.append('line')
        .attr('x1', project(cx + cs/2, cy + cs/2, cz)[0])
        .attr('y1', project(cx + cs/2, cy + cs/2, cz)[1])
        .attr('x2', project(cx + cs/2, cy + cs/2, 0)[0])
        .attr('y2', project(cx + cs/2, cy + cs/2, 0)[1])
        .attr('stroke', projLineColor)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.6)

      // To XZ plane (back) - from front of cube
      chart.append('line')
        .attr('x1', project(cx + cs/2, cy + cs, cz + cs/2)[0])
        .attr('y1', project(cx + cs/2, cy + cs, cz + cs/2)[1])
        .attr('x2', project(cx + cs/2, 0, cz + cs/2)[0])
        .attr('y2', project(cx + cs/2, 0, cz + cs/2)[1])
        .attr('stroke', projLineColor)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.6)

      // To YZ plane (side) - from right of cube
      chart.append('line')
        .attr('x1', project(cx + cs, cy + cs/2, cz + cs/2)[0])
        .attr('y1', project(cx + cs, cy + cs/2, cz + cs/2)[1])
        .attr('x2', project(0, cy + cs/2, cz + cs/2)[0])
        .attr('y2', project(0, cy + cs/2, cz + cs/2)[1])
        .attr('stroke', projLineColor)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.6)

      // Draw cube projections on planes (behind cube)
      if (!skipCubeProjections.includes('xy')) {
        drawSquare('xy', cx, cy, 0, cs, cubeColor, 0.7)
      }
      if (!skipCubeProjections.includes('xz')) {
        drawSquare('xz', cx, 0, cz, cs, cubeColor, 0.7)
      }
      if (!skipCubeProjections.includes('yz')) {
        drawSquare('yz', 0, cy, cz, cs, cubeColor, 0.7)
      }

      // Draw 3 visible faces of the cube in correct z-order (back to front)
      const cubeStroke = d3.color(cubeColor)?.darker(0.8)?.toString() || cubeColor

      // Apply same inset as projection squares for consistent sizing
      const inset = 0.08
      const x0 = cx + inset
      const x1 = cx + cs - inset
      const y0 = cy + inset
      const y1 = cy + cs - inset
      const z0 = cz + inset
      const z1 = cz + cs - inset

      // 1. Left face (xz plane at y=y1, facing +y direction) - drawn first (back)
      const leftFace = [
        project(x0, y1, z0),
        project(x1, y1, z0),
        project(x1, y1, z1),
        project(x0, y1, z1)
      ]
      chart.append('polygon')
        .attr('points', leftFace.map(c => c.join(',')).join(' '))
        .attr('fill', d3.color(cubeColor)?.darker(0.4)?.toString() || cubeColor)
        .attr('stroke', cubeStroke)
        .attr('stroke-width', 1.5)

      // 2. Right face (yz plane at x=x1, facing +x direction)
      const rightFace = [
        project(x1, y0, z0),
        project(x1, y1, z0),
        project(x1, y1, z1),
        project(x1, y0, z1)
      ]
      chart.append('polygon')
        .attr('points', rightFace.map(c => c.join(',')).join(' '))
        .attr('fill', d3.color(cubeColor)?.darker(0.2)?.toString() || cubeColor)
        .attr('stroke', cubeStroke)
        .attr('stroke-width', 1.5)

      // 3. Top face (xy plane at z=z1) - drawn last (front)
      const topFace = [
        project(x0, y0, z1),
        project(x1, y0, z1),
        project(x1, y1, z1),
        project(x0, y1, z1)
      ]
      chart.append('polygon')
        .attr('points', topFace.map(c => c.join(',')).join(' '))
        .attr('fill', cubeColor)
        .attr('stroke', cubeStroke)
        .attr('stroke-width', 1.5)
    }
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
