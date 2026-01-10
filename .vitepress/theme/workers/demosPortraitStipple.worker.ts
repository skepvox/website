import { Delaunay } from 'd3'

type StippleRequest = {
  data: Uint8Array
  width: number
  height: number
  n: number
  iterations: number
  postEvery?: number
}

type StippleResponse =
  | { type: 'tick'; points: Float32Array; iteration: number; done: boolean }
  | { type: 'error'; message: string }

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value

function respond(message: StippleResponse) {
  // eslint-disable-next-line no-restricted-globals
  ;(self as unknown as Worker).postMessage(message)
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = (event: MessageEvent<StippleRequest>) => {
  try {
    const { data, width, height, n, iterations, postEvery = 1 } = event.data

    if (!data || width <= 0 || height <= 0 || n <= 0 || iterations <= 0) {
      respond({ type: 'error', message: 'Parâmetros inválidos para stippling.' })
      // eslint-disable-next-line no-restricted-globals
      self.close()
      return
    }

    const weights = data
    const points = new Float64Array(n * 2)
    const c = new Float64Array(n * 2)
    const s = new Float64Array(n)

    // Initialize the points using rejection sampling.
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < 30; ++j) {
        const x = (points[i * 2] = Math.floor(Math.random() * width))
        const y = (points[i * 2 + 1] = Math.floor(Math.random() * height))
        if (Math.random() < weights[y * width + x] / 255) break
      }
    }

    const delaunay = new Delaunay(points)
    const voronoi = delaunay.voronoi([0, 0, width, height])

    for (let k = 0; k < iterations; ++k) {
      // Compute the weighted centroid for each Voronoi cell.
      c.fill(0)
      s.fill(0)
      for (let y = 0, i = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          const w = weights[y * width + x] / 255
          if (!w) continue
          i = delaunay.find(x + 0.5, y + 0.5, i)
          s[i] += w
          c[i * 2] += w * (x + 0.5)
          c[i * 2 + 1] += w * (y + 0.5)
        }
      }

      // Relax the diagram by moving points to the weighted centroid.
      // Wiggle the points a little bit so they don’t get stuck.
      const wiggle = Math.pow(k + 1, -0.8) * 10
      const xMax = Math.max(0, width - 1e-6)
      const yMax = Math.max(0, height - 1e-6)
      for (let i = 0; i < n; ++i) {
        const x0 = points[i * 2]
        const y0 = points[i * 2 + 1]
        const x1 = s[i] ? c[i * 2] / s[i] : x0
        const y1 = s[i] ? c[i * 2 + 1] / s[i] : y0

        points[i * 2] = clamp(
          x0 + (x1 - x0) * 1.8 + (Math.random() - 0.5) * wiggle,
          0,
          xMax
        )
        points[i * 2 + 1] = clamp(
          y0 + (y1 - y0) * 1.8 + (Math.random() - 0.5) * wiggle,
          0,
          yMax
        )
      }

      if (k % postEvery === 0 || k === iterations - 1) {
        respond({
          type: 'tick',
          points: Float32Array.from(points),
          iteration: k + 1,
          done: k === iterations - 1
        })
      }

      voronoi.update()
    }

    // eslint-disable-next-line no-restricted-globals
    self.close()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    respond({ type: 'error', message })
    // eslint-disable-next-line no-restricted-globals
    self.close()
  }
}
