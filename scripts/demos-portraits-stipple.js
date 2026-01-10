import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { Delaunay } from 'd3'
import { PNG } from 'pngjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const IN_DIR = path.join(ROOT, 'src', 'public', 'images', 'demos', 'pessoas')
const OUT_DIR = path.join(ROOT, 'src', 'public', 'images', 'demos', 'pessoas-stipple')

const DEFAULTS = {
  sample: 320,
  iterations: 80,
  pixelsPerPoint: 16,
  radius: 0.75,
  lightColor: '#213547',
  darkColor: 'rgba(255, 255, 255, 0.87)'
}

function parseArgs(args) {
  const options = { ...DEFAULTS, force: false }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--force') {
      options.force = true
      continue
    }
    if (arg === '--sample') {
      options.sample = Number(args[++i])
      continue
    }
    if (arg === '--iterations') {
      options.iterations = Number(args[++i])
      continue
    }
    if (arg === '--pixels-per-point') {
      options.pixelsPerPoint = Number(args[++i])
      continue
    }
    if (arg === '--radius') {
      options.radius = Number(args[++i])
      continue
    }
    if (arg === '--light-color') {
      options.lightColor = String(args[++i])
      continue
    }
    if (arg === '--dark-color') {
      options.darkColor = String(args[++i])
      continue
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }
  }
  return options
}

function usage() {
  return [
    'Usage:',
    '  node scripts/demos-portraits-stipple.js [--force]',
    '',
    'Options:',
    `  --sample <n>            (default: ${DEFAULTS.sample})`,
    `  --iterations <n>        (default: ${DEFAULTS.iterations})`,
    `  --pixels-per-point <n>  (default: ${DEFAULTS.pixelsPerPoint})`,
    `  --radius <n>            (default: ${DEFAULTS.radius})`,
    `  --light-color <css>     (default: ${DEFAULTS.lightColor})`,
    `  --dark-color <css>      (default: ${DEFAULTS.darkColor})`,
    '  --force                 overwrite existing SVGs',
    ''
  ].join('\n')
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromString(value) {
  const hash = crypto.createHash('sha256').update(value).digest()
  return hash.readUInt32LE(0)
}

function buildWeightsFromRgba({
  rgba,
  srcWidth,
  srcHeight,
  dstWidth,
  dstHeight
}) {
  const weights = new Uint8Array(dstWidth * dstHeight)
  const scaleX = srcWidth / dstWidth
  const scaleY = srcHeight / dstHeight

  for (let y = 0; y < dstHeight; y += 1) {
    const sy = (y + 0.5) * scaleY - 0.5
    const y0 = clamp(Math.floor(sy), 0, srcHeight - 1)
    const y1 = clamp(y0 + 1, 0, srcHeight - 1)
    const dy = sy - y0

    for (let x = 0; x < dstWidth; x += 1) {
      const sx = (x + 0.5) * scaleX - 0.5
      const x0 = clamp(Math.floor(sx), 0, srcWidth - 1)
      const x1 = clamp(x0 + 1, 0, srcWidth - 1)
      const dx = sx - x0

      const idx00 = (y0 * srcWidth + x0) * 4
      const idx10 = (y0 * srcWidth + x1) * 4
      const idx01 = (y1 * srcWidth + x0) * 4
      const idx11 = (y1 * srcWidth + x1) * 4

      const r0 = lerp(rgba[idx00], rgba[idx10], dx)
      const r1 = lerp(rgba[idx01], rgba[idx11], dx)
      const r = lerp(r0, r1, dy)

      const g0 = lerp(rgba[idx00 + 1], rgba[idx10 + 1], dx)
      const g1 = lerp(rgba[idx01 + 1], rgba[idx11 + 1], dx)
      const g = lerp(g0, g1, dy)

      const b0 = lerp(rgba[idx00 + 2], rgba[idx10 + 2], dx)
      const b1 = lerp(rgba[idx01 + 2], rgba[idx11 + 2], dx)
      const b = lerp(b0, b1, dy)

      const a0 = lerp(rgba[idx00 + 3], rgba[idx10 + 3], dx)
      const a1 = lerp(rgba[idx01 + 3], rgba[idx11 + 3], dx)
      const a = lerp(a0, a1, dy)

      const alpha = clamp(a / 255, 0, 1)
      if (alpha === 0) {
        weights[y * dstWidth + x] = 0
        continue
      }

      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const weight = clamp(Math.round((255 - luma) * alpha), 0, 255)
      weights[y * dstWidth + x] = weight
    }
  }

  return weights
}

function stipple({ weights, width, height, n, iterations, rng }) {
  const points = new Float64Array(n * 2)
  const c = new Float64Array(n * 2)
  const s = new Float64Array(n)

  // Initialize points using rejection sampling.
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < 30; j += 1) {
      const x = (points[i * 2] = Math.floor(rng() * width))
      const y = (points[i * 2 + 1] = Math.floor(rng() * height))
      if (rng() < weights[y * width + x] / 255) break
    }
  }

  const delaunay = new Delaunay(points)
  const voronoi = delaunay.voronoi([0, 0, width, height])

  for (let k = 0; k < iterations; k += 1) {
    c.fill(0)
    s.fill(0)

    for (let y = 0, i = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const w = weights[y * width + x] / 255
        if (!w) continue
        i = delaunay.find(x + 0.5, y + 0.5, i)
        s[i] += w
        c[i * 2] += w * (x + 0.5)
        c[i * 2 + 1] += w * (y + 0.5)
      }
    }

    const wiggle = Math.pow(k + 1, -0.8) * 10
    const xMax = Math.max(0, width - 1e-6)
    const yMax = Math.max(0, height - 1e-6)
    for (let i = 0; i < n; i += 1) {
      const x0 = points[i * 2]
      const y0 = points[i * 2 + 1]
      const x1 = s[i] ? c[i * 2] / s[i] : x0
      const y1 = s[i] ? c[i * 2 + 1] / s[i] : y0

      points[i * 2] = clamp(x0 + (x1 - x0) * 1.8 + (rng() - 0.5) * wiggle, 0, xMax)
      points[i * 2 + 1] = clamp(
        y0 + (y1 - y0) * 1.8 + (rng() - 0.5) * wiggle,
        0,
        yMax
      )
    }

    voronoi.update()
  }

  return points
}

function svgFromPoints({ points, width, height, radius, fill, label }) {
  const safeLabel = label?.replace(/</g, '&lt;').replace(/>/g, '&gt;') ?? 'Retrato'
  const r = Number.isFinite(radius) ? radius : DEFAULTS.radius
  const circles = []
  circles.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${safeLabel}">`)
  circles.push(`<g fill="${fill}">`)
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i]
    const y = points[i + 1]
    circles.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r}"/>`)
  }
  circles.push('</g></svg>')
  return circles.join('')
}

async function pathExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function writeFileIfChanged(filePath, content) {
  const exists = await pathExists(filePath)
  if (exists) {
    const current = await fs.readFile(filePath, 'utf-8').catch(() => null)
    if (current === content) return false
  } else {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
  }

  await fs.writeFile(filePath, content, 'utf-8')
  return true
}

async function loadPng(filePath) {
  const raw = await fs.readFile(filePath)
  const png = PNG.sync.read(raw)
  return { width: png.width, height: png.height, rgba: png.data }
}

async function generateOne({ filePath, options }) {
  const basename = path.basename(filePath, path.extname(filePath))
  const label = basename
  const outLight = path.join(OUT_DIR, `${basename}--light.svg`)
  const outDark = path.join(OUT_DIR, `${basename}--dark.svg`)

  if (!options.force) {
    const [hasLight, hasDark] = await Promise.all([pathExists(outLight), pathExists(outDark)])
    if (hasLight && hasDark) {
      return { basename, skipped: true, changed: 0 }
    }
  }

  const { width: srcWidth, height: srcHeight, rgba } = await loadPng(filePath)

  const sampleWidth = Math.max(80, Math.round(options.sample))
  const sampleHeight = Math.max(80, Math.round(sampleWidth * (srcHeight / srcWidth)))

  const weights = buildWeightsFromRgba({
    rgba,
    srcWidth,
    srcHeight,
    dstWidth: sampleWidth,
    dstHeight: sampleHeight
  })

  const pixels = sampleWidth * sampleHeight
  const n = Math.max(200, Math.round(pixels / options.pixelsPerPoint))

  const rng = mulberry32(seedFromString(basename))
  const points = stipple({
    weights,
    width: sampleWidth,
    height: sampleHeight,
    n,
    iterations: options.iterations,
    rng
  })

  const lightSvg = svgFromPoints({
    points,
    width: sampleWidth,
    height: sampleHeight,
    radius: options.radius,
    fill: options.lightColor,
    label
  })

  const darkSvg = svgFromPoints({
    points,
    width: sampleWidth,
    height: sampleHeight,
    radius: options.radius,
    fill: options.darkColor,
    label
  })

  const [lightChanged, darkChanged] = await Promise.all([
    writeFileIfChanged(outLight, `${lightSvg}\n`),
    writeFileIfChanged(outDark, `${darkSvg}\n`)
  ])

  return {
    basename,
    skipped: false,
    changed: Number(lightChanged) + Number(darkChanged),
    outLight: path.relative(ROOT, outLight),
    outDark: path.relative(ROOT, outDark)
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(usage())
    process.exit(0)
  }

  await fs.mkdir(OUT_DIR, { recursive: true })

  const entries = await fs.readdir(IN_DIR, { withFileTypes: true })
  const pngFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.png'))
    .map((entry) => path.join(IN_DIR, entry.name))
    .sort()

  if (!pngFiles.length) {
    console.log(`No PNG portraits found in ${path.relative(ROOT, IN_DIR)}.`)
    return
  }

  let changed = 0
  let skipped = 0
  const outputs = []

  for (const filePath of pngFiles) {
    const result = await generateOne({ filePath, options })
    if (result.skipped) {
      skipped += 1
      continue
    }
    changed += result.changed
    outputs.push(result)
  }

  console.log(`Generated stipple SVGs for ${outputs.length} portraits (${changed} files changed, ${skipped} skipped).`)
  for (const out of outputs) {
    console.log(`- ${out.basename}: ${out.outLight}, ${out.outDark}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

